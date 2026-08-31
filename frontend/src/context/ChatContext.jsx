import React, { createContext, useContext, useState, useCallback } from 'react';
import { sendChatMessage, createOrder, verifyOrderPayment, reportOrderFailure } from '../api/client';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'agent',
      text: "👋 Hi! I'm your AgentCart assistant. Tell me what you're looking for and I'll find the best match, suggest add-ons, and help you checkout in seconds."
    }
  ]);
  const [history, setHistory] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [prefilledInput, setPrefilledInput] = useState('');

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
        text: data.reply
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
          text: 'Sorry, I had trouble connecting to the store agent. Please make sure the server is running.'
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [history, isOpen]);

  // Razorpay Checkout Trigger
  const processCheckout = useCallback(async (items, navigate) => {
    if (!items || items.length === 0) return;

    const buyerNote = {
      id: 'system-' + Date.now(),
      role: 'agent',
      text: 'Initiating Razorpay checkout…'
    };
    setMessages(prev => [...prev, buyerNote]);

    try {
      const orderData = await createOrder(items);
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
          name: 'Test Customer',
          email: 'customer@example.com',
          contact: '9999999999'
        },
        handler: async function (response) {
          try {
            const verifyData = await verifyOrderPayment({
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
    sendMessage,
    processCheckout,
    setOrderId
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
