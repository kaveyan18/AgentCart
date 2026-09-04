import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  ShieldCheck,
  Check,
  MapPin,
  Phone,
  User,
  Edit3,
  CreditCard,
  Lock,
  X,
  Sparkles,
  AlertTriangle,
  Info,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Zap,
  LogIn
} from 'lucide-react';
import { formatPrice } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

export default function SideCheckoutDrawer({
  isOpen,
  onClose,
  items = [],
  total,
  deliveryInfo,
  onUpdateDelivery,
  onPay,
  isProcessing = false,
  orderSuccess = null,
  onResetSuccess
}) {
  const { user, isAuthenticated, login } = useAuth();
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isDemoLoggingIn, setIsDemoLoggingIn] = useState(false);
  const [tier2Confirmed, setTier2Confirmed] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 840);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 840);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Local copy of address for editing
  const [addressDraft, setAddressDraft] = useState({
    fullName: deliveryInfo?.fullName || user?.name || 'Alex Rivera',
    phone: deliveryInfo?.phone || user?.phone || '+91 98765 43210',
    street: deliveryInfo?.shippingAddress?.street || user?.shippingAddress?.street || '123 Tech Residency, 4th Cross Road',
    city: deliveryInfo?.shippingAddress?.city || user?.shippingAddress?.city || 'Bengaluru',
    state: deliveryInfo?.shippingAddress?.state || user?.shippingAddress?.state || 'Karnataka',
    postalCode: deliveryInfo?.shippingAddress?.postalCode || user?.shippingAddress?.postalCode || '560034',
    country: 'India'
  });

  // Sync draft if deliveryInfo prop updates
  useEffect(() => {
    if (deliveryInfo) {
      setAddressDraft(prev => ({
        fullName: deliveryInfo.fullName || prev.fullName,
        phone: deliveryInfo.phone || prev.phone,
        street: deliveryInfo.shippingAddress?.street || prev.street,
        city: deliveryInfo.shippingAddress?.city || prev.city,
        state: deliveryInfo.shippingAddress?.state || prev.state,
        postalCode: deliveryInfo.shippingAddress?.postalCode || prev.postalCode,
        country: 'India'
      }));
    }
  }, [deliveryInfo]);

  if (!isOpen) return null;

  const displayTotal = total || items.reduce((s, i) => s + (i.price * (i.qty || 1)), 0);

  // Tier 1: <= 50,000 | Tier 2: 50,001 - 100,000 | Tier 3: > 100,000
  const isTier1 = displayTotal <= 50000;
  const isTier2 = displayTotal > 50000 && displayTotal <= 100000;
  const isTier3 = displayTotal > 100000;

  const handleSaveAddress = () => {
    setIsEditingAddress(false);
    if (onUpdateDelivery) {
      onUpdateDelivery({
        fullName: addressDraft.fullName,
        phone: addressDraft.phone,
        shippingAddress: {
          street: addressDraft.street,
          city: addressDraft.city,
          state: addressDraft.state,
          postalCode: addressDraft.postalCode,
          country: addressDraft.country
        }
      });
    }
  };

  const handleDemoSignIn = async () => {
    setIsDemoLoggingIn(true);
    try {
      await login('buyer@parcel.test', 'buyer123');
    } catch (err) {
      console.error('Demo login failed:', err);
    } finally {
      setIsDemoLoggingIn(false);
    }
  };

  const handlePayClick = () => {
    if (onPay) {
      onPay({
        userConfirmed: isTier2 ? tier2Confirmed : true,
        fullName: addressDraft.fullName,
        phone: addressDraft.phone,
        shippingAddress: {
          street: addressDraft.street,
          city: addressDraft.city,
          state: addressDraft.state,
          postalCode: addressDraft.postalCode,
          country: addressDraft.country
        }
      });
    }
  };

  return (
    <div
      style={{
        ...styles.drawer,
        right: isMobile ? '26px' : '420px',
        width: isMobile ? 'calc(100vw - 52px)' : '385px',
        maxWidth: '385px',
        zIndex: isMobile ? 110 : 105,
        animation: isMobile ? 'bubbleIn 0.25s ease' : 'slideInLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      role="dialog"
      aria-label="Instant Checkout Drawer"
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={styles.header}>
        <div style={styles.headerTitleRow}>
          <div style={styles.iconWrap}>
            <Zap size={16} color="#ffffff" />
          </div>
          <div>
            <div style={styles.title}>Instant Checkout</div>
            <div style={styles.subTitle}>
              {isTier1 ? 'Autonomous Policy Tier 1 · Direct Chat Pay' : 'Bounded Financial Autonomy'}
            </div>
          </div>
        </div>
        <button
          style={styles.closeBtn}
          onClick={onClose}
          aria-label="Close instant checkout"
          title="Close"
        >
          <X size={17} />
        </button>
      </div>

      {/* ── Scrollable Body ──────────────────────────────────────────────── */}
      <div style={styles.body}>
        {orderSuccess ? (
          /* ── Post-Payment Celebration State (No Page Navigation) ── */
          <div style={styles.successCard}>
            <div style={styles.successIconBadge}>
              <CheckCircle2 size={44} color="#16a34a" />
            </div>
            <h3 style={styles.successTitle}>Payment Verified & Order Placed!</h3>
            <p style={styles.successDesc}>
              Your payment of <strong>{formatPrice(orderSuccess.total)}</strong> was captured seamlessly via Razorpay under the <strong>Bounded Financial Autonomy Policy</strong>.
            </p>

            <div style={styles.orderMetaBox}>
              <div style={styles.metaRow}>
                <span style={styles.metaLabel}>Order ID:</span>
                <span style={styles.metaValue}>{orderSuccess.orderId}</span>
              </div>
              {orderSuccess.paymentId && (
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>Razorpay Payment ID:</span>
                  <span style={styles.metaValue}>{orderSuccess.paymentId}</span>
                </div>
              )}
              <div style={styles.metaRow}>
                <span style={styles.metaLabel}>Status:</span>
                <span style={{ ...styles.metaValue, color: '#16a34a', fontWeight: '700' }}>✓ Paid & Verified</span>
              </div>
              <div style={styles.metaRow}>
                <span style={styles.metaLabel}>Shipping To:</span>
                <span style={styles.metaValue}>{addressDraft.fullName} ({addressDraft.city})</span>
              </div>
            </div>

            <button
              style={styles.continueShoppingBtn}
              onClick={() => {
                if (onResetSuccess) onResetSuccess();
                onClose();
              }}
            >
              <span>Continue Shopping with AI</span>
              <ArrowRight size={15} />
            </button>
          </div>
        ) : (
          /* ── Standard Checkout Details ── */
          <>
            {/* Policy Tier Banner */}
            {isTier1 && (
              <div style={styles.tier1Banner}>
                <div style={styles.tierBannerHeader}>
                  <ShieldCheck size={16} color="#16a34a" />
                  <strong>✓ Autonomous Checkout Approved (≤ ₹50,000)</strong>
                </div>
                <div style={styles.tierBannerText}>
                  Under 50 thousand: The AI agent is authorized to checkout directly from chat. No page redirection required.
                </div>
              </div>
            )}

            {isTier2 && (
              <div style={styles.tier2Banner}>
                <div style={styles.tierBannerHeader}>
                  <AlertTriangle size={16} color="#ca8a04" />
                  <strong>⚠ Explicit Confirmation Required (₹50,001 – ₹1,00,000)</strong>
                </div>
                <div style={styles.tierBannerText}>
                  This purchase requires your explicit checkbox confirmation before initiating Razorpay payment.
                </div>
              </div>
            )}

            {isTier3 && (
              <div style={styles.tier3Banner}>
                <div style={styles.tierBannerHeader}>
                  <Info size={16} color="#0284c7" />
                  <strong>ℹ Manual Checkout Required (&gt; ₹1,00,000)</strong>
                </div>
                <div style={styles.tierBannerText}>
                  This transaction exceeds the agent's autonomous limit. Please review and complete on the Cart page.
                </div>
              </div>
            )}

            {/* Cart Items List */}
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <ShoppingBag size={14} color="var(--ink)" />
                <span style={styles.sectionTitle}>Cart Items ({items.length})</span>
              </div>
              <div style={styles.itemsList}>
                {items.length === 0 ? (
                  <div style={styles.emptyItemsText}>No items selected.</div>
                ) : (
                  items.map((it, idx) => (
                    <div key={idx} style={styles.itemRow}>
                      <div style={styles.itemColLeft}>
                        <div style={styles.itemDot}></div>
                        <div>
                          <div style={styles.itemName}>{it.name}</div>
                          <div style={styles.itemQty}>Qty: {it.qty || 1} × {formatPrice(it.price)}</div>
                        </div>
                      </div>
                      <div style={styles.itemPrice}>
                        {formatPrice(it.price * (it.qty || 1))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Price Breakdown */}
              <div style={styles.priceBreakdown}>
                <div style={styles.priceRow}>
                  <span>Subtotal</span>
                  <span>{formatPrice(displayTotal)}</span>
                </div>
                <div style={styles.priceRow}>
                  <span>Express Delivery</span>
                  <span style={{ color: '#16a34a', fontWeight: '600' }}>FREE</span>
                </div>
                <div style={styles.totalRow}>
                  <span>Total Payable</span>
                  <span style={styles.totalAmount}>{formatPrice(displayTotal)}</span>
                </div>
              </div>
            </div>

            {/* Delivery & Shipping Address */}
            <div style={styles.section}>
              <div style={styles.deliverySectionHeader}>
                <div style={styles.sectionHeader}>
                  <MapPin size={14} color="var(--coral)" />
                  <span style={styles.sectionTitle}>Shipping & Contact</span>
                </div>
                <button
                  type="button"
                  style={styles.editBtn}
                  onClick={() => {
                    if (isEditingAddress) handleSaveAddress();
                    else setIsEditingAddress(true);
                  }}
                >
                  <Edit3 size={12} />
                  <span>{isEditingAddress ? 'Save' : 'Edit'}</span>
                </button>
              </div>

              {!isEditingAddress ? (
                <div style={styles.addressPreview}>
                  <div style={styles.contactLine}>
                    <User size={13} color="var(--slate)" />
                    <strong>{addressDraft.fullName}</strong>
                    <span style={{ color: 'var(--border)', margin: '0 4px' }}>•</span>
                    <Phone size={13} color="var(--slate)" />
                    <span>{addressDraft.phone}</span>
                  </div>
                  <div style={styles.addressLine}>
                    {addressDraft.street}, {addressDraft.city}, {addressDraft.state} - {addressDraft.postalCode}
                  </div>
                </div>
              ) : (
                <div style={styles.addressForm}>
                  <div style={styles.formRow}>
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={addressDraft.fullName}
                      onChange={(e) => setAddressDraft({ ...addressDraft, fullName: e.target.value })}
                      style={styles.input}
                    />
                    <input
                      type="text"
                      placeholder="Phone (+91...)"
                      value={addressDraft.phone}
                      onChange={(e) => setAddressDraft({ ...addressDraft, phone: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Street Address / Flat No."
                    value={addressDraft.street}
                    onChange={(e) => setAddressDraft({ ...addressDraft, street: e.target.value })}
                    style={styles.input}
                  />
                  <div style={styles.formRow}>
                    <input
                      type="text"
                      placeholder="City"
                      value={addressDraft.city}
                      onChange={(e) => setAddressDraft({ ...addressDraft, city: e.target.value })}
                      style={styles.input}
                    />
                    <input
                      type="text"
                      placeholder="PIN Code"
                      value={addressDraft.postalCode}
                      onChange={(e) => setAddressDraft({ ...addressDraft, postalCode: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <button
                    type="button"
                    style={styles.saveAddressBtn}
                    onClick={handleSaveAddress}
                  >
                    Done Editing
                  </button>
                </div>
              )}
            </div>

            {/* Auth Notice (if guest) */}
            {!isAuthenticated && (
              <div style={styles.authNoticeBox}>
                <div style={styles.authNoticeText}>
                  <Lock size={14} color="var(--coral)" />
                  <span>Please sign in to link this order to your buyer audit trail.</span>
                </div>
                <button
                  type="button"
                  style={styles.demoLoginBtn}
                  onClick={handleDemoSignIn}
                  disabled={isDemoLoggingIn}
                >
                  <LogIn size={13} />
                  <span>{isDemoLoggingIn ? 'Signing in…' : '1-Click Sign In as Demo Buyer (Alex Rivera)'}</span>
                </button>
              </div>
            )}

            {/* Tier 2 Confirmation Checkbox */}
            {isTier2 && (
              <label style={styles.confirmationLabel}>
                <input
                  type="checkbox"
                  checked={tier2Confirmed}
                  onChange={(e) => setTier2Confirmed(e.target.checked)}
                  style={{ accentColor: 'var(--coral)', width: '16px', height: '16px' }}
                />
                <span style={styles.confirmationText}>
                  I confirm and authorize this transaction of {formatPrice(displayTotal)} under the Tier 2 policy requirement.
                </span>
              </label>
            )}
          </>
        )}
      </div>

      {/* ── Footer / Payment Action Button ──────────────────────────────── */}
      {!orderSuccess && (
        <div style={styles.footer}>
          {isTier1 && (
            <button
              style={{
                ...styles.payBtn,
                background: 'linear-gradient(135deg, var(--coral), var(--coral-dark))',
                opacity: isProcessing || (!isAuthenticated && !isDemoLoggingIn) ? 0.9 : 1
              }}
              onClick={handlePayClick}
              disabled={isProcessing}
            >
              <CreditCard size={17} color="#ffffff" />
              <span>
                {isProcessing
                  ? 'Connecting to Razorpay…'
                  : `Pay ${formatPrice(displayTotal)} with Razorpay`}
              </span>
              <ArrowRight size={15} color="#ffffff" />
            </button>
          )}

          {isTier2 && (
            <button
              style={{
                ...styles.payBtn,
                background: 'linear-gradient(135deg, var(--mustard), #b45309)',
                opacity: !tier2Confirmed || isProcessing ? 0.6 : 1,
                cursor: !tier2Confirmed ? 'not-allowed' : 'pointer'
              }}
              onClick={handlePayClick}
              disabled={!tier2Confirmed || isProcessing}
            >
              <ShieldCheck size={17} color="#ffffff" />
              <span>
                {isProcessing
                  ? 'Initiating Payment…'
                  : `Confirm & Pay ${formatPrice(displayTotal)}`}
              </span>
              <ArrowRight size={15} color="#ffffff" />
            </button>
          )}

          {isTier3 && (
            <button
              style={{
                ...styles.payBtn,
                background: 'linear-gradient(135deg, #0284c7, #0369a1)'
              }}
              onClick={() => {
                window.location.href = '/cart';
              }}
            >
              <ShoppingBag size={17} color="#ffffff" />
              <span>Continue via Cart Page • {formatPrice(displayTotal)}</span>
              <ArrowRight size={15} color="#ffffff" />
            </button>
          )}

          <div style={styles.footerSecurityText}>
            <Lock size={10} />
            <span>256-Bit SSL · Razorpay Gateway · Zero-Trust Price Enforced</span>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  drawer: {
    position: 'fixed',
    bottom: '100px',
    right: '420px',
    width: '385px',
    height: '540px',
    background: 'var(--white)',
    borderRadius: '24px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 105,
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-xl)',
    animation: 'slideInLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
  },
  header: {
    background: 'var(--ink-2)',
    color: '#ffffff',
    padding: '13px 18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0
  },
  headerTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  iconWrap: {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, var(--coral), var(--coral-dark))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(240, 101, 74, 0.4)'
  },
  title: {
    fontFamily: 'var(--font-brand)',
    fontSize: '15px',
    fontWeight: '700'
  },
  subTitle: {
    fontSize: '11px',
    color: 'var(--sage)',
    marginTop: '1px'
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
    gap: '12px',
    overflowY: 'auto'
  },
  tier1Banner: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '12px',
    padding: '10px 12px'
  },
  tier2Banner: {
    background: '#fefce8',
    border: '1px solid #fef08a',
    borderRadius: '12px',
    padding: '10px 12px'
  },
  tier3Banner: {
    background: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '12px',
    padding: '10px 12px'
  },
  tierBannerHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#166534',
    marginBottom: '3px'
  },
  tierBannerText: {
    fontSize: '11px',
    color: 'var(--slate)',
    lineHeight: '1.4'
  },
  section: {
    background: 'var(--cream)',
    borderRadius: '14px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--ink)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  emptyItemsText: {
    fontSize: '12px',
    color: 'var(--slate)',
    fontStyle: 'italic'
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--white)',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid var(--border)'
  },
  itemColLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  itemDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--coral)',
    flexShrink: 0
  },
  itemName: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--ink)',
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  itemQty: {
    fontSize: '11px',
    color: 'var(--slate)'
  },
  itemPrice: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--ink)'
  },
  priceBreakdown: {
    borderTop: '1px dashed var(--border)',
    paddingTop: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginTop: '4px'
  },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: 'var(--slate)'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--ink)',
    marginTop: '4px'
  },
  totalAmount: {
    fontSize: '15px',
    color: 'var(--coral)',
    fontWeight: '800'
  },
  deliverySectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  editBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--coral)',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    padding: '2px 6px',
    borderRadius: '4px'
  },
  addressPreview: {
    fontSize: '12px',
    lineHeight: '1.45',
    color: 'var(--ink)',
    background: 'var(--white)',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid var(--border)'
  },
  contactLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '12px',
    marginBottom: '3px'
  },
  addressLine: {
    fontSize: '11px',
    color: 'var(--slate)'
  },
  addressForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px'
  },
  input: {
    width: '100%',
    padding: '7px 9px',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    fontSize: '11px',
    background: '#ffffff',
    color: 'var(--ink)',
    boxSizing: 'border-box'
  },
  saveAddressBtn: {
    background: 'var(--ink)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    alignSelf: 'flex-end',
    marginTop: '2px'
  },
  authNoticeBox: {
    background: '#fff1f2',
    border: '1px solid #fecdd3',
    borderRadius: '12px',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  authNoticeText: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: '#9f1239'
  },
  demoLoginBtn: {
    background: 'linear-gradient(135deg, var(--coral), var(--coral-dark))',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '7px 10px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  },
  confirmationLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    fontSize: '11px',
    color: 'var(--ink)',
    cursor: 'pointer',
    background: 'var(--cream)',
    padding: '8px 10px',
    borderRadius: '8px'
  },
  confirmationText: {
    lineHeight: '1.4'
  },
  footer: {
    padding: '12px 14px',
    borderTop: '1px solid var(--border)',
    background: 'var(--white)',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  payBtn: {
    width: '100%',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 14px',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(240, 101, 74, 0.3)',
    transition: 'transform 0.15s ease, opacity 0.15s ease'
  },
  footerSecurityText: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    fontSize: '10px',
    color: 'var(--slate)',
    marginTop: '2px'
  },
  successCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '20px 10px',
    gap: '12px'
  },
  successIconBadge: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: '#dcfce7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '4px'
  },
  successTitle: {
    fontFamily: 'var(--font-brand)',
    fontSize: '17px',
    fontWeight: '700',
    color: '#166534',
    margin: 0
  },
  successDesc: {
    fontSize: '12px',
    color: 'var(--slate)',
    lineHeight: '1.5',
    margin: 0
  },
  orderMetaBox: {
    width: '100%',
    background: 'var(--cream)',
    borderRadius: '12px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    textAlign: 'left'
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px'
  },
  metaLabel: {
    color: 'var(--slate)'
  },
  metaValue: {
    color: 'var(--ink)',
    fontWeight: '600'
  },
  continueShoppingBtn: {
    background: 'var(--ink)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 18px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '8px'
  }
};
