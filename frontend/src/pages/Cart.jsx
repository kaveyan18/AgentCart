import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  MapPin,
  Phone,
  User,
  Edit3,
  Bot,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import Nav from '../components/Nav';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { formatPrice, getProductImage, getCategoryTheme } from '../utils/helpers';

export default function Cart() {
  const { cartItems, cartCount, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { processCheckout, openChatWithPrompt } = useChat();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

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

  const isOverPolicyLimit = cartTotal > 100000;

  const handleProceedToCheckout = async () => {
    if (cartItems.length === 0) return;

    if (isOverPolicyLimit) {
      setCheckoutError('Order total exceeds the ₹1,00,000 policy gate limit. Please reduce item quantities.');
      return;
    }

    setCheckoutError(null);
    setIsProcessing(true);

    const deliveryInfo = {
      fullName: delivery.fullName,
      phone: delivery.phone,
      shippingAddress: {
        street: delivery.street,
        city: delivery.city,
        state: delivery.state,
        postalCode: delivery.postalCode,
        country: delivery.country
      }
    };

    try {
      await processCheckout(
        cartItems,
        navigate,
        deliveryInfo,
        () => {
          // Callback invoked only on successful payment verification:
          clearCart();
        }
      );
    } catch (err) {
      setCheckoutError(err.message || 'Payment could not be initiated.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="page">
      <Nav />

      {/* Breadcrumb / Back button */}
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate('/')}>
          <ArrowLeft size={16} />
          <span>Back to Catalog</span>
        </button>
        <h1 style={styles.pageTitle}>
          Shopping Cart
          {cartCount > 0 && <span style={styles.countBadge}>{cartCount} {cartCount === 1 ? 'item' : 'items'}</span>}
        </h1>
      </div>

      {cartItems.length === 0 ? (
        /* Empty Cart State */
        <div style={styles.emptyCard}>
          <div style={styles.emptyIconWrap}>
            <ShoppingBag size={48} color="var(--slate)" />
          </div>
          <h2 style={styles.emptyTitle}>Your shopping cart is empty</h2>
          <p style={styles.emptyDesc}>
            Looks like you haven't added anything yet. Explore our curated electronics catalog or ask our AI Concierge to help you find the right setup.
          </p>
          <div style={styles.emptyActions}>
            <Link to="/" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <ArrowLeft size={16} />
              <span>Browse Catalog</span>
            </Link>
            <button
              className="btn btn-secondary"
              onClick={() => openChatWithPrompt('Can you recommend the top trending electronics in the store?')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Bot size={16} color="var(--coral)" />
              <span>Ask AI Concierge</span>
            </button>
          </div>
        </div>
      ) : (
        /* Active Cart Layout */
        <div style={styles.cartGrid}>
          {/* Left Column: Cart Items List */}
          <div style={styles.itemsSection}>
            <div style={styles.itemsHeader}>
              <span style={{ fontWeight: '700', color: 'var(--ink)' }}>Items in Cart</span>
              <button style={styles.clearCartBtn} onClick={clearCart}>
                Clear All
              </button>
            </div>

            <div style={styles.itemList}>
              {cartItems.map((item) => {
                const prodId = item.id || item._id;
                const img = getProductImage(prodId);
                const theme = getCategoryTheme(item.category);
                const lineTotal = item.price * (item.qty || 1);

                return (
                  <div key={prodId} style={styles.itemRow}>
                    {/* Thumbnail */}
                    <div style={styles.thumbWrap}>
                      <img
                        src={img}
                        alt={item.name}
                        style={styles.thumb}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/hero_banner.jpg';
                        }}
                      />
                    </div>

                    {/* Details */}
                    <div style={styles.itemDetails}>
                      <div style={styles.itemCategoryBadge}>
                        <span style={{ ...styles.categoryPill, background: theme.bg }}>
                          {item.category || 'Electronics'}
                        </span>
                      </div>
                      <Link to={`/product/${prodId}`} style={styles.itemNameLink}>
                        {item.name}
                      </Link>
                      <div style={styles.unitPrice}>
                        Unit Price: <strong style={{ color: 'var(--ink)' }}>{formatPrice(item.price)}</strong>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div style={styles.qtyContainer}>
                      <div style={styles.qtyControls}>
                        <button
                          type="button"
                          style={styles.qtyBtn}
                          onClick={() => updateQuantity(prodId, (item.qty || 1) - 1)}
                          title="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span style={styles.qtyNumber}>{item.qty || 1}</span>
                        <button
                          type="button"
                          style={styles.qtyBtn}
                          onClick={() => updateQuantity(prodId, (item.qty || 1) + 1)}
                          title="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Subtotal & Delete */}
                    <div style={styles.subtotalCol}>
                      <div style={styles.lineSubtotal}>{formatPrice(lineTotal)}</div>
                      <button
                        type="button"
                        style={styles.removeBtn}
                        onClick={() => removeFromCart(prodId)}
                        title="Remove product"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI Assistant Hint Banner */}
            <div style={styles.aiHintBox}>
              <div style={styles.aiHintIcon}>
                <Sparkles size={16} color="#ffffff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--ink)' }}>
                  Looking for matching accessories?
                </div>
                <div style={{ fontSize: '12px', color: 'var(--slate)', marginTop: '2px' }}>
                  Ask our AI Concierge to evaluate your cart and recommend compatible cables, stands, or fast chargers.
                </div>
              </div>
              <button
                style={styles.aiHintBtn}
                onClick={() =>
                  openChatWithPrompt(`I have ${cartItems.map((i) => i.name).join(', ')} in my cart. What accessories do you suggest?`)
                }
              >
                <span>Ask AI</span>
              </button>
            </div>
          </div>

          {/* Right Column: Order Summary & Checkout Gate */}
          <div style={styles.summarySection}>
            <div style={styles.summaryCard}>
              <h2 style={styles.summaryTitle}>Order Summary</h2>

              {/* Policy Gate Check Pill */}
              <div
                style={{
                  ...styles.policyBadge,
                  background: isOverPolicyLimit ? 'var(--coral-bg)' : 'var(--sage-bg)',
                  borderColor: isOverPolicyLimit ? 'var(--coral)' : 'var(--sage)'
                }}
              >
                <ShieldCheck size={16} color={isOverPolicyLimit ? 'var(--coral)' : 'var(--sage)'} />
                <span style={{ color: isOverPolicyLimit ? 'var(--coral-dark)' : 'var(--sage)' }}>
                  {isOverPolicyLimit
                    ? 'Exceeds ₹1,00,000 policy limit'
                    : 'Policy Gate Approved (≤ ₹1,00,000)'}
                </span>
              </div>

              {/* Price Line Items */}
              <div style={styles.summaryRows}>
                <div style={styles.summaryRow}>
                  <span>Subtotal ({cartCount} {cartCount === 1 ? 'item' : 'items'})</span>
                  <span style={{ fontWeight: '600', color: 'var(--ink)' }}>{formatPrice(cartTotal)}</span>
                </div>
                <div style={styles.summaryRow}>
                  <span>Fulfillment & Dispatch</span>
                  <span style={{ color: 'var(--sage)', fontWeight: '600' }}>Free Express Delivery</span>
                </div>
                <div style={styles.summaryRow}>
                  <span>Estimated Taxes</span>
                  <span style={{ color: 'var(--slate)', fontSize: '12px' }}>Included in price</span>
                </div>

                <div style={styles.summaryDivider} />

                <div style={styles.totalRow}>
                  <span>Total Amount</span>
                  <span style={styles.totalPrice}>{formatPrice(cartTotal)}</span>
                </div>
              </div>

              {/* Delivery Address Preview / Edit */}
              <div style={styles.deliveryContainer}>
                <div style={styles.deliveryHead}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="var(--coral)" />
                    <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--ink)' }}>
                      Delivery Destination
                    </span>
                  </div>
                  <button
                    type="button"
                    style={styles.editDeliveryToggle}
                    onClick={() => setIsEditingDelivery(!isEditingDelivery)}
                  >
                    <Edit3 size={12} />
                    <span>{isEditingDelivery ? 'Done' : 'Edit'}</span>
                  </button>
                </div>

                {!isEditingDelivery ? (
                  <div style={styles.addressPreview}>
                    <div style={styles.recipientLine}>
                      <User size={12} color="var(--slate)" />
                      <strong>{delivery.fullName}</strong>
                      <span style={{ margin: '0 4px', color: 'var(--slate)' }}>•</span>
                      <Phone size={12} color="var(--slate)" />
                      <span>{delivery.phone}</span>
                    </div>
                    <div style={styles.streetLine}>
                      {delivery.street}, {delivery.city}, {delivery.state} - {delivery.postalCode}
                    </div>
                  </div>
                ) : (
                  <div style={styles.deliveryForm}>
                    <div style={styles.formTwoCol}>
                      <input
                        type="text"
                        placeholder="Recipient Name"
                        value={delivery.fullName}
                        onChange={(e) => setDelivery({ ...delivery, fullName: e.target.value })}
                        style={styles.inputField}
                      />
                      <input
                        type="text"
                        placeholder="Contact Phone"
                        value={delivery.phone}
                        onChange={(e) => setDelivery({ ...delivery, phone: e.target.value })}
                        style={styles.inputField}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Street Address / Flat / Building"
                      value={delivery.street}
                      onChange={(e) => setDelivery({ ...delivery, street: e.target.value })}
                      style={styles.inputField}
                    />
                    <div style={styles.formTwoCol}>
                      <input
                        type="text"
                        placeholder="City"
                        value={delivery.city}
                        onChange={(e) => setDelivery({ ...delivery, city: e.target.value })}
                        style={styles.inputField}
                      />
                      <input
                        type="text"
                        placeholder="PIN Code"
                        value={delivery.postalCode}
                        onChange={(e) => setDelivery({ ...delivery, postalCode: e.target.value })}
                        style={styles.inputField}
                      />
                    </div>
                  </div>
                )}
              </div>

              {checkoutError && (
                <div style={styles.errorCard}>
                  <AlertCircle size={15} color="var(--coral-dark)" />
                  <span>{checkoutError}</span>
                </div>
              )}

              {/* Proceed to Checkout Action */}
              <button
                type="button"
                className="btn btn-primary"
                style={styles.checkoutBtn}
                disabled={isProcessing || isOverPolicyLimit}
                onClick={handleProceedToCheckout}
              >
                <CreditCard size={18} />
                <span>
                  {isProcessing
                    ? 'Initializing Razorpay…'
                    : `Proceed to Checkout • ${formatPrice(cartTotal)}`}
                </span>
                <ArrowRight size={16} />
              </button>

              <div style={styles.guaranteeFoot}>
                <CheckCircle2 size={13} color="var(--sage)" />
                <span>HMAC-SHA256 signature settlement · Verified Razorpay Gateway</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  topBar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '24px'
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    color: 'var(--slate)',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: 0,
    width: 'fit-content'
  },
  pageTitle: {
    fontFamily: 'var(--font-brand)',
    fontSize: '28px',
    fontWeight: '700',
    color: 'var(--ink)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  countBadge: {
    fontSize: '13px',
    fontWeight: '700',
    background: 'var(--cream)',
    color: 'var(--coral-dark)',
    border: '1px solid var(--sand)',
    padding: '3px 10px',
    borderRadius: '16px'
  },
  emptyCard: {
    background: 'var(--white)',
    borderRadius: '24px',
    padding: '60px 24px',
    textAlign: 'center',
    border: '1px solid rgba(239, 232, 218, 0.9)',
    boxShadow: 'var(--shadow-sm)',
    maxWidth: '560px',
    margin: '40px auto'
  },
  emptyIconWrap: {
    width: '84px',
    height: '84px',
    borderRadius: '50%',
    background: 'var(--cream)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px'
  },
  emptyTitle: {
    fontFamily: 'var(--font-brand)',
    fontSize: '22px',
    fontWeight: '700',
    color: 'var(--ink)',
    marginBottom: '8px'
  },
  emptyDesc: {
    fontSize: '14px',
    color: 'var(--slate)',
    lineHeight: '1.6',
    marginBottom: '28px'
  },
  emptyActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '14px',
    flexWrap: 'wrap'
  },
  cartGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: '28px',
    alignItems: 'flex-start'
  },
  itemsSection: {
    background: 'var(--white)',
    borderRadius: '24px',
    padding: '24px',
    border: '1px solid rgba(239, 232, 218, 0.9)',
    boxShadow: 'var(--shadow-sm)'
  },
  itemsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--border)'
  },
  clearCartBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--coral)',
    fontSize: '12.5px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  itemList: {
    display: 'flex',
    flexDirection: 'column'
  },
  itemRow: {
    display: 'grid',
    gridTemplateColumns: '90px 1fr 110px 110px',
    gap: '16px',
    alignItems: 'center',
    padding: '20px 0',
    borderBottom: '1px solid var(--border)'
  },
  thumbWrap: {
    width: '90px',
    height: '90px',
    borderRadius: '14px',
    overflow: 'hidden',
    background: 'var(--cream)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(239, 232, 218, 0.8)'
  },
  thumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  itemDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  itemCategoryBadge: {
    marginBottom: '2px'
  },
  categoryPill: {
    fontSize: '10.5px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    padding: '2px 8px',
    borderRadius: '6px',
    color: 'var(--ink)'
  },
  itemNameLink: {
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--ink)',
    textDecoration: 'none',
    lineHeight: '1.3'
  },
  unitPrice: {
    fontSize: '12px',
    color: 'var(--slate)'
  },
  qtyContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  qtyControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--cream)',
    borderRadius: '12px',
    padding: '4px 8px',
    border: '1px solid var(--sand)'
  },
  qtyBtn: {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    background: 'var(--white)',
    border: '1px solid rgba(0,0,0,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--ink)'
  },
  qtyNumber: {
    fontSize: '13px',
    fontWeight: '700',
    minWidth: '20px',
    textAlign: 'center',
    color: 'var(--ink)'
  },
  subtotalCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px'
  },
  lineSubtotal: {
    fontFamily: 'var(--font-brand)',
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--ink)'
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--slate)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '6px',
    transition: 'color 0.15s ease'
  },
  aiHintBox: {
    marginTop: '20px',
    background: 'linear-gradient(135deg, var(--mustard-bg) 0%, #fff9ed 100%)',
    borderRadius: '16px',
    padding: '14px 18px',
    border: '1px solid rgba(232, 179, 61, 0.35)',
    display: 'flex',
    alignItems: 'center',
    gap: '14px'
  },
  aiHintIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, var(--mustard), #d69f29)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  aiHintBtn: {
    background: 'var(--white)',
    border: '1px solid var(--sand)',
    borderRadius: '10px',
    padding: '7px 14px',
    fontSize: '12.5px',
    fontWeight: '700',
    color: 'var(--ink)',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
  },
  summarySection: {
    position: 'sticky',
    top: '20px'
  },
  summaryCard: {
    background: 'var(--white)',
    borderRadius: '24px',
    padding: '24px',
    border: '1px solid rgba(239, 232, 218, 0.9)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  summaryTitle: {
    fontFamily: 'var(--font-brand)',
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--ink)'
  },
  policyBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '12px',
    border: '1px solid',
    fontSize: '12px',
    fontWeight: '700'
  },
  summaryRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13.5px',
    color: 'var(--slate)'
  },
  summaryDivider: {
    height: '1px',
    background: 'var(--border)',
    margin: '6px 0'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--ink)'
  },
  totalPrice: {
    fontFamily: 'var(--font-brand)',
    fontSize: '24px',
    fontWeight: '800',
    color: 'var(--coral-dark)'
  },
  deliveryContainer: {
    background: 'var(--cream)',
    borderRadius: '16px',
    padding: '14px',
    border: '1px solid var(--sand)'
  },
  deliveryHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  editDeliveryToggle: {
    background: 'none',
    border: 'none',
    color: 'var(--coral-dark)',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  addressPreview: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  recipientLine: {
    fontSize: '12px',
    color: 'var(--ink)',
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  },
  streetLine: {
    fontSize: '11.5px',
    color: 'var(--slate)',
    lineHeight: '1.4'
  },
  deliveryForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '6px'
  },
  formTwoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px'
  },
  inputField: {
    background: 'var(--white)',
    border: '1px solid var(--sand)',
    borderRadius: '8px',
    padding: '8px 10px',
    fontSize: '12px',
    color: 'var(--ink)',
    outline: 'none'
  },
  errorCard: {
    background: 'var(--coral-bg)',
    color: 'var(--coral-dark)',
    padding: '10px 12px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  checkoutBtn: {
    width: '100%',
    padding: '14px',
    fontSize: '15px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: '14px',
    marginTop: '4px'
  },
  guaranteeFoot: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: 'var(--slate)',
    justifyContent: 'center',
    textAlign: 'center'
  }
};
