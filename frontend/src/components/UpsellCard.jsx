import React from 'react';
import { Sparkles, Plus } from 'lucide-react';
import { formatPrice } from '../utils/helpers';

export default function UpsellCard({ name, price, reason, onSelect }) {
  return (
    <div
      style={styles.card}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      title="Click to add this recommended add-on"
    >
      <div style={styles.icon}>
        <Sparkles size={16} color="#ffffff" />
      </div>

      <div style={{ flex: 1 }}>
        <div style={styles.nameRow}>
          <span style={styles.name}>{name}</span>
          {price ? <span style={styles.price}>{formatPrice(price)}</span> : null}
        </div>
        {reason && <div style={styles.reason}>{reason}</div>}
      </div>

      <div style={styles.addBtn}>
        <Plus size={14} color="var(--ink)" />
      </div>
    </div>
  );
}

const styles = {
  card: {
    alignSelf: 'flex-start',
    maxWidth: '92%',
    background: 'linear-gradient(135deg, var(--mustard-bg) 0%, #fff9ec 100%)',
    borderRadius: '16px',
    padding: '10px 14px',
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    border: '1.5px solid rgba(232, 179, 61, 0.45)',
    cursor: 'pointer',
    animation: 'bubbleIn 0.25s ease',
    margin: '6px 0',
    boxShadow: '0 4px 12px rgba(232, 179, 61, 0.15)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
  },
  icon: {
    width: '32px',
    height: '32px',
    flexShrink: 0,
    background: 'linear-gradient(135deg, var(--mustard), #d69f29)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(232, 179, 61, 0.4)'
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'space-between'
  },
  name: {
    fontSize: '12.5px',
    fontWeight: '700',
    color: 'var(--ink)'
  },
  price: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--coral-dark)'
  },
  reason: {
    fontSize: '11px',
    color: 'var(--slate)',
    marginTop: '2px'
  },
  addBtn: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    background: 'var(--white)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
    flexShrink: 0
  }
};
