import React, { useState } from 'react';
import { ShieldCheck, Lock, Check, MapPin, Phone, User, Edit3, ChevronDown, ChevronUp, ShoppingCart, ArrowRight } from 'lucide-react';
import { formatPrice } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

export default function GateCard({ items = [], total, onConfirm, isProcessing }) {
  const { user } = useAuth();
  const displayTotal = total || items.reduce((s, i) => s + (i.price * (i.qty || 1)), 0);

  // Delivery & Contact State
  const [isEditingDelivery, setIsEditingDelivery] = useState(false);
  const [delivery, setDelivery] = useState({
    fullName: user?.name || 'Alex Rivera',
    phone: user?.phone || '+91 98765 43210',
    street: user?.shippingAddress?.street || '123 Tech Residency, 4th Cross Road',
    city: user?.shippingAddress?.city || 'Bengaluru',
    state: user?.shippingAddress?.state || 'Karnataka',
    postalCode: user?.shippingAddress?.postalCode || '560034',
    country: 'India'
  });

  const handleConfirmClick = () => {
    onConfirm({
      fullName: delivery.fullName,
      phone: delivery.phone,
      shippingAddress: {
        street: delivery.street,
        city: delivery.city,
        state: delivery.state,
        postalCode: delivery.postalCode,
        country: delivery.country
      }
    });
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.gateBadge}>
          <ShieldCheck size={14} color="#3A6B45" />
          <span>Policy Gate Approved (Max ₹1,00,000)</span>
        </div>
      </div>

      {/* Items Summary */}
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

      {/* ── Shipping & Contact Information Section ──────────────────────────── */}
      <div style={styles.deliveryBox}>
        <div style={styles.deliveryHeader}>
          <div style={styles.deliveryTitle}>
            <MapPin size={13} color="var(--coral)" />
            <span>Shipping & Contact</span>
          </div>
          <button
            type="button"
            onClick={() => setIsEditingDelivery(!isEditingDelivery)}
            style={styles.editDeliveryBtn}
          >
            <Edit3 size={11} />
            <span>{isEditingDelivery ? 'Done' : 'Edit'}</span>
          </button>
        </div>

        {!isEditingDelivery ? (
          <div style={styles.deliveryPreview}>
            <div style={styles.deliveryLine}>
              <User size={12} color="var(--slate)" />
              <strong style={{ color: 'var(--ink)' }}>{delivery.fullName}</strong>
              <span style={{ color: 'var(--slate)', margin: '0 4px' }}>•</span>
              <Phone size={12} color="var(--slate)" />
              <span>{delivery.phone}</span>
            </div>
            <div style={styles.addressLine}>
              {delivery.street}, {delivery.city}, {delivery.state} - {delivery.postalCode}
            </div>
          </div>
        ) : (
          <div style={styles.deliveryForm}>
            <div style={styles.formRow}>
              <input
                type="text"
                placeholder="Full Name"
                value={delivery.fullName}
                onChange={(e) => setDelivery({ ...delivery, fullName: e.target.value })}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Phone (+91...)"
                value={delivery.phone}
                onChange={(e) => setDelivery({ ...delivery, phone: e.target.value })}
                style={styles.input}
              />
            </div>
            <input
              type="text"
              placeholder="Street Address / Flat No."
              value={delivery.street}
              onChange={(e) => setDelivery({ ...delivery, street: e.target.value })}
              style={styles.input}
            />
            <div style={styles.formRow}>
              <input
                type="text"
                placeholder="City"
                value={delivery.city}
                onChange={(e) => setDelivery({ ...delivery, city: e.target.value })}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="PIN Code"
                value={delivery.postalCode}
                onChange={(e) => setDelivery({ ...delivery, postalCode: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>
        )}
      </div>

      {/* Review in Cart & Checkout Button */}
      <button
        style={styles.confirmBtn}
        onClick={handleConfirmClick}
        disabled={isProcessing}
      >
        <ShoppingCart size={15} color="#fff" />
        <span>Review in Cart & Checkout • {formatPrice(displayTotal)}</span>
        <ArrowRight size={14} color="#fff" />
      </button>

      <div style={styles.securityNote}>
        Every order is validated via policy gate and reviewed in your Cart
      </div>
    </div>
  );
}

const styles = {
  card: {
    alignSelf: 'flex-start',
    maxWidth: '96%',
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
    color: 'var(--ink)',
    marginBottom: '12px'
  },
  totalAmount: {
    fontFamily: 'var(--font-brand)',
    fontSize: '18px',
    color: 'var(--coral-dark)'
  },
  deliveryBox: {
    background: 'var(--cream)',
    borderRadius: '12px',
    padding: '10px 12px',
    border: '1px solid var(--sand)',
    marginBottom: '12px'
  },
  deliveryHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '6px'
  },
  deliveryTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '11.5px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    color: 'var(--slate)'
  },
  editDeliveryBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--coral-dark)',
    fontSize: '11.5px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    padding: '2px 4px'
  },
  deliveryPreview: {
    fontSize: '12px',
    color: 'var(--ink)',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  deliveryLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px'
  },
  addressLine: {
    fontSize: '11.5px',
    color: 'var(--slate)',
    lineHeight: '1.4'
  },
  deliveryForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginTop: '6px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px'
  },
  input: {
    width: '100%',
    padding: '6px 8px',
    borderRadius: '6px',
    border: '1px solid var(--sand)',
    fontSize: '11.5px',
    background: 'var(--white)',
    color: 'var(--ink)',
    outline: 'none',
    boxSizing: 'border-box'
  },
  confirmBtn: {
    marginTop: '4px',
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
