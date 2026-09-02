import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { sendChatMessage, createOrder, verifyOrderPayment, reportOrderFailure, getStoredToken, getStoredUser } from '../api/client';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

const DEFAULT_WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'agent',
  text: "👋 Hi! I'm your AgentCart electronics assistant. Tell me what tech or gear you're looking for, and I'll find matches, suggest cross-sells, and guide you through verified checkout."
};

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const userId = user?._id || user?.id || user?.email || 'guest';
  const prevUserIdRef = useRef(userId);

  const [messages, setMessages] = useState([DEFAULT_WELCOME_MESSAGE]);
  const [history, setHistory] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [prefilledInput, setPrefilledInput] = useState('');

  const resetChat = useCallback(() => {
    setMessages([{ ...DEFAULT_WELCOME_MESSAGE, id: 'welcome-' + Date.now() }]);
    setHistory([]);
    setOrderId(null);
    setPrefilledInput('');
    setUnreadCount(0);
  }, []);

  // Clear previous user's chat when user logs in, logs out, or switches accounts
  useEffect(() => {
    if (prevUserIdRef.current !== userId) {
      prevUserIdRef.current = userId;
      resetChat();
    }
  }, [userId, resetChat]);

  const toggleChat = useCallback(() => {
    setIsOpen(prev => {
      if (!prev) {
        setUnreadCount(0);
      }
      return !prev;
    });
  }, []);

  const openChatWithPrompt = useCallback((promptText) => {
    setIsOpen(true);
    setUnreadCount(0);
    setPrefilledInput(promptText);
  }, []);

  // Send message to Groq agent orchestrator
  const sendMessage = useCallback(async (text) => {
    if (!text || !text.trim()) return;

    const buyerMsg = {
      id: 'buyer-' + Date.now(),
      role: 'buyer',
      text: text.trim()
    };

    setMessages(prev => [...prev, buyerMsg]);
    setIsTyping(true);

    try {
      const data = await sendChatMessage(text.trim(), history);
      setHistory(data.history || []);

      const agentMsg = {
        id: 'agent-' + Date.now(),
        role: 'agent',
        text: data.reply,
        items: data.proposedOrder?.items || null,
        total: data.proposedOrder?.total || null,
        upsell: data.upsell || null
      };

      setMessages(prev => [...prev, agentMsg]);

      if (!isOpen) {
        setUnreadCount(c => c + 1);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: 'error-' + Date.now(),
          role: 'agent',
          text: 'Sorry, I had trouble connecting to the store agent. Please make sure the backend server is running.'
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [history, isOpen]);

  // Razorpay Checkout Trigger
  const processCheckout = useCallback(async (items, navigate, deliveryInfo = {}) => {
    if (!items || items.length === 0) return;

    const token = getStoredToken();
    const currentUser = getStoredUser();

    if (!token) {
      setMessages(prev => [
        ...prev,
        {
          id: 'auth-required-' + Date.now(),
          role: 'agent',
          text: '🔐 Please sign in to your account first so this order can be linked to your profile and policy audit trail.'
        }
      ]);
      if (navigate) {
        navigate('/login?redirect=/');
      }
      return;
    }

    const buyerNote = {
      id: 'system-' + Date.now(),
      role: 'agent',
      text: 'Initiating Razorpay checkout…'
    };
    setMessages(prev => [...prev, buyerNote]);

    try {
      const orderData = await createOrder(items, 0, deliveryInfo);
      setOrderId(orderData.orderId);

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.razorpayOrderId,
        name: 'AgentCart',
        description: items.map(i => i.name).join(', '),
        theme: { color: '#F0654A' },
        prefill: {
          name: deliveryInfo.fullName || currentUser?.name || 'Customer',
          email: currentUser?.email || 'customer@example.com',
          contact: deliveryInfo.phone || currentUser?.phone || '9999999999'
        },
        handler: async function (response) {
          try {
            await verifyOrderPayment({
              orderId: orderData.orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature
            });

            // Notify agent so it can explain status
            await sendMessage(`Payment attempt completed for order ${orderData.orderId}, please check status and let the buyer know`);

            if (navigate) {
              navigate('/confirm', {
                state: {
                  success: true,
                  orderId: orderData.orderId,
                  items,
                  total: items.reduce((s, i) => s + (i.price * (i.qty || 1)), 0)
                }
              });
            }
          } catch (vErr) {
            console.error('Payment verification failed:', vErr);
            setMessages(prev => [
              ...prev,
              {
                id: 'err-' + Date.now(),
                role: 'agent',
                text: 'Payment verification failed. Please check server logs.'
              }
            ]);
          }
        },
        modal: {
          ondismiss: function () {
            setMessages(prev => [
              ...prev,
              {
                id: 'cancel-' + Date.now(),
                role: 'agent',
                text: "Payment was cancelled. You can continue shopping or retry whenever you're ready."
              }
            ]);
          }
        }
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', async function (response) {
        const errorDesc = response.error?.description || 'Payment declined';
        await reportOrderFailure({
          orderId: orderData.orderId,
          razorpayOrderId: orderData.razorpayOrderId,
          errorReason: errorDesc,
          errorCode: response.error?.code || 'PAYMENT_FAILED'
        });

        await sendMessage(`Payment failed for order ${orderData.orderId} (${errorDesc}), please check status and explain to the buyer`);

        if (navigate) {
          navigate('/confirm', {
            state: {
              success: false,
              orderId: orderData.orderId,
              items,
              errorReason: errorDesc,
              total: items.reduce((s, i) => s + (i.price * (i.qty || 1)), 0)
            }
          });
        }
      });

      rzp.open();
    } catch (err) {
      console.error('Checkout error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'agent',
          text: `Checkout could not be started: ${err.message}`
        }
      ]);
    }
  }, [sendMessage]);

  const value = {
    messages,
    history,
    isOpen,
    unreadCount,
    isTyping,
    orderId,
    prefilledInput,
    setPrefilledInput,
    toggleChat,
    openChatWithPrompt,
    setIsOpen,
    closeChat: () => setIsOpen(false),
    sendMessage,
    processCheckout,
    setOrderId,
    resetChat
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
