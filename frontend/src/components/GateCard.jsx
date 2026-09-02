import React from 'react';
import { ShieldCheck, Lock, Check } from 'lucide-react';
import { formatPrice } from '../utils/helpers';

export default function GateCard({ items = [], total, onConfirm, isProcessing }) {
  const displayTotal = total || items.reduce((s, i) => s + (i.price * (i.qty || 1)), 0);

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.gateBadge}>
          <ShieldCheck size={14} color="#3A6B45" />
          <span>Policy Gate Approved (Max ₹1,00,000)</span>
        </div>
      </div>

      <div style={styles.itemsList}>
        {items.map((it, idx) => (
          <div key={idx} style={styles.row}>
            <span style={styles.itemName}>
              <Check size={12} color="var(--sage)" style={{ marginRight: '4px', flexShrink: 0 }} />
              {it.name} {it.qty && it.qty > 1 ? `× ${it.qty}` : ''}
            </span>
            <span style={styles.itemPrice}>{formatPrice(it.price * (it.qty || 1))}</span>
          </div>
        ))}
      </div>

      <div style={styles.totalRow}>
        <span>Total Payable</span>
        <span style={styles.totalAmount}>{formatPrice(displayTotal)}</span>
      </div>

      <button
        style={styles.confirmBtn}
        onClick={onConfirm}
        disabled={isProcessing}
      >
        <Lock size={14} color="#fff" />
        <span>{isProcessing ? 'Opening Razorpay…' : `Pay ${formatPrice(displayTotal)} via Razorpay`}</span>
      </button>

      <div style={styles.securityNote}>
        Direct HMAC-SHA256 signature verification enabled
      </div>
    </div>
  );
}

const styles = {
  card: {
    alignSelf: 'flex-start',
    maxWidth: '94%',
    background: 'var(--white)',
    borderRadius: '18px',
    padding: '16px',
    animation: 'bubbleIn 0.25s ease',
    width: '100%',
    margin: '8px 0',
    border: '1.5px solid var(--border)',
    boxShadow: 'var(--shadow-md)'
  },
  header: {
    marginBottom: '12px'
  },
  gateBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    background: 'var(--sage-bg)',
    color: '#3A6B45',
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '20px'
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '12px'
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12.5px',
    color: 'var(--ink)',
    alignItems: 'center'
  },
  itemName: {
    display: 'flex',
    alignItems: 'center',
    color: 'var(--ink)',
    fontWeight: '500'
  },
  itemPrice: {
    fontWeight: '600',
    color: 'var(--ink)'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    fontWeight: '700',
    paddingTop: '10px',
    borderTop: '1px solid var(--border)',
    color: 'var(--ink)'
  },
  totalAmount: {
    fontFamily: 'var(--font-brand)',
    fontSize: '18px',
    color: 'var(--coral-dark)'
  },
  confirmBtn: {
    marginTop: '14px',
    width: '100%',
    background: 'linear-gradient(135deg, var(--coral) 0%, var(--coral-dark) 100%)',
    color: '#ffffff',
    border: 'none',
    padding: '13px',
    fontSize: '13.5px',
    fontWeight: '700',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 6px 18px rgba(240, 101, 74, 0.35)',
    transition: 'transform 0.15s ease, background 0.15s ease'
  },
  securityNote: {
    fontSize: '10px',
    color: 'var(--slate)',
    textAlign: 'center',
    marginTop: '8px',
    fontWeight: '500'
  }
};
