import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Send, X, Sparkles, RotateCcw } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import GateCard from './GateCard';
import UpsellCard from './UpsellCard';

/* ── Lightweight Markdown → React renderer ───────────────────────────────── */
function MarkdownText({ text, isAgent }) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Numbered list item: "1. item"
    if (/^\d+\.\s/.test(line)) {
      const listItems = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} style={mdStyles.ol}>
          {listItems.map((item, idx) => (
            <li key={idx} style={mdStyles.li}><InlineMarkdown text={item} /></li>
          ))}
        </ol>
      );
      continue;
    }

    // Bullet list item: "- item" or "* item"
    if (/^[-*]\s/.test(line)) {
      const listItems = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^[-*]\s/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={mdStyles.ul}>
          {listItems.map((item, idx) => (
            <li key={idx} style={mdStyles.li}><InlineMarkdown text={item} /></li>
          ))}
        </ul>
      );
      continue;
    }

    // Blank line → spacing
    if (line.trim() === '') {
      elements.push(<div key={`sp-${i}`} style={{ height: '6px' }} />);
      i++;
      continue;
    }

    // Normal paragraph line
    elements.push(
      <p key={`p-${i}`} style={mdStyles.p}>
        <InlineMarkdown text={line} />
      </p>
    );
    i++;
  }

  return <div>{elements}</div>;
}

/* Handles **bold**, *italic*, and `code` within a single line */
function InlineMarkdown({ text }) {
  // Split on **bold**, *italic*, `code`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, idx) => {
        if (/^\*\*[^*]+\*\*$/.test(part)) {
          return <strong key={idx} style={{ fontWeight: '700' }}>{part.slice(2, -2)}</strong>;
        }
        if (/^\*[^*]+\*$/.test(part)) {
          return <em key={idx}>{part.slice(1, -1)}</em>;
        }
        if (/^`[^`]+`$/.test(part)) {
          return <code key={idx} style={mdStyles.code}>{part.slice(1, -1)}</code>;
        }
        return part;
      })}
    </>
  );
}

const mdStyles = {
  p:    { margin: '0 0 2px 0', lineHeight: '1.55' },
  ol:   { margin: '4px 0', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '3px' },
  ul:   { margin: '4px 0', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '3px' },
  li:   { lineHeight: '1.5' },
  code: { background: 'rgba(0,0,0,0.08)', borderRadius: '4px', padding: '1px 5px', fontFamily: 'monospace', fontSize: '12px' },
};

export default function ChatPanel() {
  const {
    messages,
    isOpen,
    isTyping,
    prefilledInput,
    setPrefilledInput,
    toggleChat,
    sendMessage,
    processCheckout,
    resetChat
  } = useChat();

  const [input, setInput] = useState('');
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Keep input in sync with prefilled prompt
  useEffect(() => {
    if (prefilledInput) {
      setInput(prefilledInput);
      setPrefilledInput('');
      inputRef.current?.focus();
    }
  }, [prefilledInput, setPrefilledInput]);

  // Auto-scroll when messages or typing change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSend = (e) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;
    const text = input;
    setInput('');
    sendMessage(text);
  };

  const handleCheckoutClick = async (items, deliveryInfo) => {
    setIsProcessingCheckout(true);
    try {
      await processCheckout(items, navigate, deliveryInfo);
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  return (
    <div style={styles.panel} role="dialog" aria-label="AgentCart Assistant">
      {/* Head */}
      <div style={styles.head}>
        <div style={styles.headBrand}>
          <div style={styles.avatar}>
            <Bot size={18} color="#fff" />
          </div>
          <div>
            <div style={styles.headTitle}>AgentCart AI Concierge</div>
            <div style={styles.headStatus}>
              <span style={styles.dot}></span> Groq LLaMA 3.3 · Policy Verified
            </div>
          </div>
        </div>
        <div style={styles.headActions}>
          <button
            style={styles.actionBtn}
            onClick={resetChat}
            title="Start new conversation"
            aria-label="New chat"
          >
            <RotateCcw size={15} />
          </button>
          <button
            style={styles.actionBtn}
            onClick={() => setIsOpen(false)}
            aria-label="Close chat"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={styles.body}>
        {messages.map((m) => (
          <React.Fragment key={m.id}>
            <div
              style={{
                ...styles.bubble,
                ...(m.role === 'buyer' ? styles.buyerBubble : styles.agentBubble)
              }}
            >
              {m.role === 'agent' && (
                <div style={styles.agentTag}>
                  <Sparkles size={11} color="var(--coral)" />
                  <span>AgentCart</span>
                </div>
              )}
              <div style={styles.bubbleText}>
                {m.role === 'agent'
                  ? <MarkdownText text={m.text} />
                  : m.text
                }
              </div>
            </div>

            {/* Structured Items / Gate Card */}
            {m.items && m.items.length > 0 && (
              <GateCard
                items={m.items}
                total={m.total}
                onConfirm={(deliveryInfo) => handleCheckoutClick(m.items, deliveryInfo)}
                isProcessing={isProcessingCheckout}
              />
            )}

            {/* Upsell Card */}
            {m.upsell && (
              <UpsellCard
                name={m.upsell.name}
                price={m.upsell.price}
                reason={m.upsell.reason}
                onSelect={() => sendMessage(`Yes, please add the ${m.upsell.name} to my order`)}
              />
            )}
          </React.Fragment>
        ))}

        {isTyping && (
          <div style={styles.typingIndicator}>
            <div style={styles.typingAvatar}>
              <Bot size={13} color="var(--slate)" />
            </div>
            <div style={styles.typingDots}>
              <span style={styles.dot1}></span>
              <span style={styles.dot2}></span>
              <span style={styles.dot3}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer */}
      <form style={styles.footer} onSubmit={handleSend}>
        <div style={styles.inputRow}>
          <input
            ref={inputRef}
            type="text"
            style={styles.input}
            placeholder="Type a message or request a product…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            autoComplete="off"
          />
          <button
            type="submit"
            style={styles.sendBtn}
            disabled={!input.trim() || isTyping}
            aria-label="Send message"
          >
            <Send size={16} color="#fff" />
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  panel: {
    position: 'fixed',
    bottom: '100px',
    right: '26px',
    width: '380px',
    height: '540px',
    background: 'var(--white)',
    borderRadius: '24px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 100,
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-xl)',
    animation: 'bubbleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
  },
  head: {
    background: 'var(--ink-2)',
    color: '#ffffff',
    padding: '14px 18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0
  },
  headBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, var(--coral), var(--coral-dark))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(240, 101, 74, 0.4)'
  },
  headTitle: {
    fontFamily: 'var(--font-brand)',
    fontSize: '15px',
    fontWeight: '700'
  },
  headStatus: {
    fontSize: '11px',
    color: 'var(--sage)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '1px'
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--sage)',
    display: 'inline-block'
  },
  headActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  actionBtn: {
    cursor: 'pointer',
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    color: '#ffffff',
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s ease'
  },
  closeBtn: {
    cursor: 'pointer',
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    color: '#ffffff',
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s ease'
  },
  body: {
    flex: 1,
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    overflowY: 'auto'
  },
  bubble: {
    maxWidth: '85%',
    fontSize: '13px',
    lineHeight: '1.55',
    padding: '10px 14px',
    borderRadius: '16px',
    animation: 'bubbleIn 0.25s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },
  agentTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--coral)',
    marginBottom: '2px'
  },
  bubbleText: {
    wordBreak: 'break-word'
  },
  buyerBubble: {
    alignSelf: 'flex-end',
    background: 'linear-gradient(135deg, var(--coral), var(--coral-dark))',
    color: '#ffffff',
    borderBottomRightRadius: '4px'
  },
  agentBubble: {
    alignSelf: 'flex-start',
    background: 'var(--cream)',
    color: 'var(--ink)',
    borderBottomLeftRadius: '4px'
  },
  typingIndicator: {
    alignSelf: 'flex-start',
    background: 'var(--cream)',
    borderRadius: '16px',
    padding: '10px 14px',
    borderBottomLeftRadius: '4px',
    animation: 'bubbleIn 0.25s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  typingAvatar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  typingDots: {
    display: 'flex',
    gap: '4px'
  },
  dot1: {
    width: '6px',
    height: '6px',
    background: 'var(--slate)',
    borderRadius: '50%'
  },
  dot2: {
    width: '6px',
    height: '6px',
    background: 'var(--slate)',
    borderRadius: '50%'
  },
  dot3: {
    width: '6px',
    height: '6px',
    background: 'var(--slate)',
    borderRadius: '50%'
  },
  footer: {
    padding: '10px 14px 14px',
    flexShrink: 0,
    borderTop: '1px solid var(--border)',
    background: 'var(--white)'
  },
  inputRow: {
    display: 'flex',
    gap: '8px'
  },
  input: {
    flex: 1,
    border: '1.5px solid var(--border)',
    borderRadius: '14px',
    padding: '10px 14px',
    fontSize: '13px',
    outline: 'none',
    background: 'var(--cream)',
    transition: 'border-color 0.2s ease, background 0.2s ease'
  },
  sendBtn: {
    background: 'var(--coral)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '14px',
    width: '42px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(240, 101, 74, 0.3)'
  }
};
