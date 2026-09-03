import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, ShoppingBag, ShieldCheck, Copy, Check } from 'lucide-react';
import Nav from '../components/Nav';
import { formatPrice, getProductImage } from '../utils/helpers';

export default function OrderConfirmed() {
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = React.useState(false);

  // State passed from processCheckout handler
  const {
    success = true,
    orderId = '6A9183A4',
    items = [{ name: 'iPhone 15 Silicone Case', price: 599, qty: 1 }, { name: 'iPhone 15 Tempered Glass Screen Protector', price: 199, qty: 1 }],
    total = 798,
    delivery = null,
    errorReason = 'Card declined by issuing bank'
  } = location.state || {};

  const handleCopy = () => {
    navigator.clipboard.writeText(String(orderId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page">
      <Nav />

      <div style={styles.confirmWrap}>
        <div style={styles.confirmCard}>
          {success ? (
            <>
              {/* Success Badge */}
              <div style={styles.successIconWrap}>
                <CheckCircle2 size={48} color="#3A6B45" />
              </div>

              <div style={styles.verifiedPill}>
                <ShieldCheck size={14} color="var(--sage)" />
                <span>HMAC Signature Verified & Paid</span>
              </div>

              <h2 style={styles.title}>Payment Successful!</h2>
              <div style={styles.subtitle}>
                Your order is confirmed and has been routed for fulfillment.
              </div>

              {/* Order ID Box */}
              <div style={styles.orderIdBox}>
                <span style={styles.orderIdText}>Order #{String(orderId).slice(-8).toUpperCase()}</span>
                <button style={styles.copyBtn} onClick={handleCopy} title="Copy Order ID">
                  {copied ? <Check size={14} color="var(--sage)" /> : <Copy size={14} color="var(--slate)" />}
                </button>
              </div>

              {/* Line Items with Images */}
              <div style={styles.itemsList}>
                {items.map((item, i) => {
                  const img = getProductImage(item._id || item.productId);
                  return (
                    <div key={i} style={styles.itemRow}>
                      <div style={styles.itemLeft}>
                        <div style={styles.itemThumbWrap}>
                          <img
                            src={img}
                            alt={item.name}
                            style={styles.itemThumb}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/images/hero_banner.jpg';
                            }}
                          />
                        </div>
                        <div>
                          <div style={styles.itemName}>{item.name}</div>
                          <div style={styles.itemQty}>Qty: {item.qty || 1}</div>
                        </div>
                      </div>
                      <span style={styles.itemPrice}>{formatPrice(item.price * (item.qty || 1))}</span>
                    </div>
                  );
                })}

                <div style={styles.totalRow}>
                  <span>Total Paid</span>
                  <span style={styles.totalAmount}>{formatPrice(total)}</span>
                </div>
              </div>

              {delivery && (
                <div style={{ background: 'var(--cream)', borderRadius: '12px', padding: '12px 16px', margin: '16px 0', fontSize: '13px', textAlign: 'left', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: '3px' }}>
                    Shipping to: {delivery.fullName} ({delivery.phone})
                  </div>
                  <div style={{ color: 'var(--slate)' }}>
                    {delivery.shippingAddress?.street || delivery.street}, {delivery.shippingAddress?.city || delivery.city}, {delivery.shippingAddress?.state || delivery.state} – {delivery.shippingAddress?.postalCode || delivery.postalCode}
                  </div>
                </div>
              )}

              <div style={styles.actionButtons}>
                <button
                  className="btn btn-primary btn-full"
                  onClick={() => navigate('/')}
                >
                  <span>Continue Shopping</span>
                  <ArrowRight size={16} />
                </button>
                <button
                  className="btn btn-secondary btn-full"
                  onClick={() => navigate('/orders')}
                >
                  <span>View All Orders</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Failure Badge */}
              <div style={styles.failureIconWrap}>
                <XCircle size={48} color="var(--rust)" />
              </div>

              <h2 style={styles.title}>Payment Failed</h2>
              <div style={styles.subtitle}>
                {errorReason || 'Your transaction could not be processed by the bank.'}
              </div>

              <div style={styles.errorNotice}>
                <span>Order reference: #{String(orderId).slice(-8).toUpperCase()}</span>
              </div>

              <div style={styles.actionButtons}>
                <button
                  className="btn btn-primary btn-full"
                  onClick={() => navigate('/confirm')}
                >
                  <span>Retry Payment</span>
                </button>
                <button
                  className="btn btn-secondary btn-full"
                  onClick={() => navigate('/')}
                >
                  <span>Browse Other Products</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  confirmWrap: {
    display: 'flex',
    justifyContent: 'center',
    padding: '40px 0 60px'
  },
  confirmCard: {
    background: 'var(--white)',
    borderRadius: '28px',
    padding: '40px',
    width: '520px',
    maxWidth: '100%',
    textAlign: 'center',
    boxShadow: 'var(--shadow-xl)',
    border: '1px solid rgba(239, 232, 218, 0.9)'
  },
  successIconWrap: {
    width: '74px',
    height: '74px',
    borderRadius: '50%',
    background: 'var(--sage-bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
    boxShadow: '0 4px 16px rgba(143, 175, 151, 0.3)'
  },
  failureIconWrap: {
    width: '74px',
    height: '74px',
    borderRadius: '50%',
    background: 'var(--rust-bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
    boxShadow: '0 4px 16px rgba(178, 74, 62, 0.25)'
  },
  verifiedPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'var(--sage-bg)',
    color: '#3A6B45',
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 12px',
    borderRadius: '20px',
    marginBottom: '12px'
  },
  title: {
    fontFamily: 'var(--font-brand)',
    fontSize: '26px',
    fontWeight: '700',
    marginBottom: '6px',
    color: 'var(--ink)'
  },
  subtitle: {
    fontSize: '13.5px',
    color: 'var(--slate)',
    marginBottom: '20px',
    lineHeight: '1.5'
  },
  orderIdBox: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--cream)',
    padding: '6px 14px',
    borderRadius: '10px',
    marginBottom: '24px',
    border: '1px solid var(--border)'
  },
  orderIdText: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--ink)'
  },
  copyBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: '2px'
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '28px',
    background: 'var(--cream)',
    padding: '16px',
    borderRadius: '18px',
    border: '1px solid var(--border)'
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    padding: '6px 0',
    borderBottom: '1px solid rgba(239, 232, 218, 0.8)',
    textAlign: 'left'
  },
  itemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  itemThumbWrap: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    overflow: 'hidden',
    background: 'var(--white)',
    flexShrink: 0
  },
  itemThumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  itemName: {
    fontWeight: '600',
    color: 'var(--ink)',
    fontSize: '12.5px'
  },
  itemQty: {
    fontSize: '11px',
    color: 'var(--slate)'
  },
  itemPrice: {
    fontWeight: '700',
    color: 'var(--ink)'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '15px',
    fontWeight: '700',
    padding: '12px 0 0',
    textAlign: 'left',
    color: 'var(--ink)'
  },
  totalAmount: {
    fontFamily: 'var(--font-brand)',
    fontSize: '20px',
    color: 'var(--coral-dark)'
  },
  errorNotice: {
    padding: '12px',
    background: 'var(--rust-bg)',
    borderRadius: '12px',
    color: 'var(--rust)',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '24px'
  },
  actionButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  }
};
