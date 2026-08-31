import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bot, Sparkles } from 'lucide-react';
import { useChat } from '../context/ChatContext';

export default function ChatBubble() {
  const { toggleChat, unreadCount, isOpen } = useChat();
  const location = useLocation();

  // Hide chat bubble on Merchant Console page
  if (location.pathname === '/admin') {
    return null;
  }

  return (
    <button
      style={{
        ...styles.bubble,
        transform: isOpen ? 'scale(0.9)' : 'scale(1)'
      }}
      onClick={toggleChat}
      aria-label="Open chat with AgentCart AI"
      title="Chat with AgentCart AI Concierge"
    >
      <div style={styles.iconContainer}>
        <Bot size={26} color="#ffffff" />
        <div style={styles.sparkleBadge}>
          <Sparkles size={10} color="#ffffff" />
        </div>
      </div>

      {unreadCount > 0 && (
        <div style={styles.badge}>
          {unreadCount}
        </div>
      )}
    </button>
  );
}

const styles = {
  bubble: {
    position: 'fixed',
    bottom: '26px',
    right: '26px',
    width: '62px',
    height: '62px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--coral) 0%, var(--coral-dark) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 100,
    boxShadow: '0 8px 28px rgba(240, 101, 74, 0.45)',
    transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    border: '2px solid rgba(255, 255, 255, 0.4)'
  },
  iconContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sparkleBadge: {
    position: 'absolute',
    top: '-6px',
    right: '-6px',
    background: 'var(--mustard)',
    borderRadius: '50%',
    width: '14px',
    height: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)'
  },
  badge: {
    position: 'absolute',
    top: '-3px',
    right: '-3px',
    width: '22px',
    height: '22px',
    background: 'var(--ink-2)',
    color: '#ffffff',
    borderRadius: '50%',
    fontSize: '11px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid var(--cream)',
    boxShadow: 'var(--shadow-sm)'
  }
};
