import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CreditCard,
  MapPin,
  Phone,
  User,
  Edit3,
  ShieldCheck,
  AlertCircle,
  ShoppingBag,
  Truck,
  Lock
} from 'lucide-react';
import Nav from '../components/Nav';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { createOrder, verifyOrderPayment, reportOrderFailure } from '../api/client';
import { formatPrice, getProductImage, getCategoryTheme } from '../utils/helpers';

export default function CheckoutConfirm() {
  const { cartItems, cartCount, cartTotal, clearCart } = useCart();
  const { user, updateProfile } = useAuth();
  const { sendMessage } = useChat();
  const navigate = useNavigate();
  const location = useLocation();

  // Prefer delivery passed from Cart state, fallback to user profile or defaults
  const initialDelivery = location.state?.delivery || {
    fullName: user?.name || 'Alex Rivera',
    phone: user?.phone || '+91 98765 43210',
    street: user?.shippingAddress?.street || '123 Tech Residency, 4th Cross Road',
    city: user?.shippingAddress?.city || 'Bengaluru',
    state: user?.shippingAddress?.state || 'Karnataka',
    postalCode: user?.shippingAddress?.postalCode || '560034',
    country: user?.shippingAddress?.country || 'India'
  };

  const [delivery, setDelivery] = useState(initialDelivery);
  const [isEditingDelivery, setIsEditingDelivery] = useState(false);
  const [saveToProfile, setSaveToProfile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Sync if user profile loads after mount and delivery hasn't been modified
  useEffect(() => {
    if (user && !location.state?.delivery) {
      setDelivery((prev) => ({
        fullName: prev.fullName || user.name || '',
        phone: prev.phone || user.phone || '',
        street: prev.street || user.shippingAddress?.street || '',
        city: prev.city || user.shippingAddress?.city || '',
        state: prev.state || user.shippingAddress?.state || '',
        postalCode: prev.postalCode || user.shippingAddress?.postalCode || '',
        country: prev.country || user.shippingAddress?.country || 'India'
      }));
    }
  }, [user, location.state?.delivery]);

  // If cart is empty, render graceful empty state
  if (cartItems.length === 0) {
    return (
      <div className="page">
        <Nav />
        <div style={styles.emptyCard}>
          <div style={styles.emptyIconWrap}>
            <ShoppingBag size={44} color="var(--slate)" />
          </div>
          <h2 style={styles.emptyTitle}>No items to confirm</h2>
          <p style={styles.emptyDesc}>
            Your cart is currently empty. Add products to your cart first to review and confirm your order.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}
          >
            <ArrowLeft size={16} />
            <span>Browse Products</span>
          </button>
        </div>
      </div>
    );
  }

  const handleSaveDelivery = async () => {
    setIsEditingDelivery(false);
    if (saveToProfile && typeof updateProfile === 'function') {
      try {
        await updateProfile({
          phone: delivery.phone,
          shippingAddress: {
            street: delivery.street,
            city: delivery.city,
            state: delivery.state,
            postalCode: delivery.postalCode,
            country: delivery.country
          }
        });
      } catch (err) {
        console.warn('Could not save address to profile:', err);
      }
    }
  };

  const handlePayWithRazorpay = async () => {
    setErrorMessage(null);
    setIsProcessing(true);

    const deliveryPayload = {
      fullName: delivery.fullName,
      phone: delivery.phone,
      isManualCheckout: true,
      userConfirmed: true,
      source: 'user',
      shippingAddress: {
        street: delivery.street,
        city: delivery.city,
        state: delivery.state,
        postalCode: delivery.postalCode,
        country: delivery.country
      }
    };

    try {
      // 1. Create order in backend & Razorpay
      const orderData = await createOrder(cartItems, 0, deliveryPayload);

      const rawPhone = delivery.phone || user?.phone || '9999999999';
      const cleanContact = rawPhone.replace(/[^0-9]/g, '').slice(-10) || '9999999999';

      // 2. Configure Razorpay checkout options
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.razorpayOrderId,
        name: 'AgentCart',
        description: cartItems.map((i) => i.name).join(', '),
        theme: { color: '#F0654A' },
        prefill: {
          name: delivery.fullName || user?.name || 'Customer',
          email: user?.email || 'customer@example.com',
          contact: cleanContact
        },
        handler: async function (response) {
          try {
            await verifyOrderPayment({
              orderId: orderData.orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature
            });

            // Clear server/local cart upon successful payment verification
            await clearCart();

            // Notify AI assistant audit channel
            if (typeof sendMessage === 'function') {
              try {
                await sendMessage(
                  `Payment attempt completed for order ${orderData.orderId}, please check status and let the buyer know`
                );
              } catch (chatErr) {
                console.warn('Chat notification error:', chatErr);
              }
            }

            // Route to order confirmation & success receipt
            navigate('/order-success', {
              state: {
                success: true,
                orderId: orderData.orderId,
                items: cartItems,
                total: cartTotal,
                delivery: deliveryPayload
              }
            });
          } catch (vErr) {
            console.error('Payment verification failed:', vErr);
            setErrorMessage('Payment was received by Razorpay but signature verification failed. Please contact support.');
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            setErrorMessage('Payment was cancelled or closed. Your order details are preserved so you can retry whenever ready.');
          }
        }
      };

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK is not loaded. Please check your internet connection.');
      }

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', async function (response) {
        const errorDesc = response.error?.description || 'Payment declined by issuer';
        try {
          await reportOrderFailure({
            orderId: orderData.orderId,
            razorpayOrderId: orderData.razorpayOrderId,
            errorReason: errorDesc,
            errorCode: response.error?.code || 'PAYMENT_FAILED'
          });
        } catch (failErr) {
          console.warn('Could not record failure:', failErr);
        }

        setIsProcessing(false);
        navigate('/order-success', {
          state: {
            success: false,
            orderId: orderData.orderId,
            items: cartItems,
            errorReason: errorDesc,
            total: cartTotal
          }
        });
      });

      rzp.open();
    } catch (err) {
      console.error('Order creation error:', err);
      setErrorMessage(err.message || 'Could not initiate Razorpay payment. Please try again.');
      setIsProcessing(false);
    }
  };

  // Determine policy tier for visual indicator
  const isTier1 = cartTotal <= 50000;
  const isTier2 = cartTotal > 50000 && cartTotal <= 100000;
  const isTier3 = cartTotal > 100000;

  return (
    <div className="page">
      <Nav />

      {/* Top Navigation & Breadcrumbs */}
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate('/cart')}>
          <ArrowLeft size={16} />
          <span>Back to Shopping Cart</span>
        </button>
      </div>

      {/* Checkout Progress Stepper */}
      <div style={styles.stepperContainer}>
        <div style={styles.stepperWrap}>
          {/* Step 1: Cart (Done) */}
          <Link to="/cart" style={styles.stepItemDone}>
            <div style={styles.stepCircleDone}>
              <Check size={14} color="#ffffff" strokeWidth={3} />
            </div>
            <span style={styles.stepLabelDone}>1. Shopping Cart</span>
          </Link>

          <div style={styles.stepLineDone} />

          {/* Step 2: Confirm Order (Active) */}
          <div style={styles.stepItemActive}>
            <div style={styles.stepCircleActive}>2</div>
            <span style={styles.stepLabelActive}>2. Review & Confirm</span>
          </div>

          <div style={styles.stepLineUpcoming} />

          {/* Step 3: Payment (Upcoming) */}
          <div style={styles.stepItemUpcoming}>
            <div style={styles.stepCircleUpcoming}>3</div>
            <span style={styles.stepLabelUpcoming}>3. Razorpay Payment</span>
          </div>
        </div>
      </div>

      {/* Page Title */}
      <div style={styles.titleRow}>
        <div>
          <h1 style={styles.pageTitle}>Confirm Your Order</h1>
          <p style={styles.pageSubtitle}>
            Please review your product selection and delivery address before proceeding to payment.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div style={styles.alertBanner}>
          <AlertCircle size={18} color="var(--coral-dark)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '14px', color: 'var(--ink)' }}>{errorMessage}</div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div style={styles.grid}>
        {/* Left Column: Product Details & Delivery Address */}
        <div style={styles.mainCol}>
          {/* ── 1. PRODUCT DETAILS REVIEW ───────────────────────────── */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={18} color="var(--coral)" />
                <h2 style={styles.cardTitle}>Product Details</h2>
                <span style={styles.countBadge}>
                  {cartCount} {cartCount === 1 ? 'item' : 'items'}
                </span>
              </div>
              <Link to="/cart" style={styles.editLink}>
                Edit Cart
              </Link>
            </div>

            <div style={styles.itemList}>
              {cartItems.map((item) => {
                const prodId = item.productId || item.id || item._id;
                const img = getProductImage(prodId);
                const theme = getCategoryTheme(item.category);
                const lineTotal = item.price * (item.qty || 1);

                return (
                  <div key={prodId} style={styles.itemRow}>
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

                    <div style={styles.itemInfo}>
                      <span style={{ ...styles.categoryPill, background: theme.bg }}>
                        {item.category || 'Electronics'}
                      </span>
                      <Link to={`/product/${prodId}`} style={styles.itemName}>
                        {item.name}
                      </Link>
                      <div style={styles.itemMeta}>
                        <span>Unit: {formatPrice(item.price)}</span>
                        <span style={{ margin: '0 6px', color: 'var(--slate)' }}>•</span>
                        <span style={styles.qtyBadge}>Qty: {item.qty || 1}</span>
                      </div>
                    </div>

                    <div style={styles.itemPriceCol}>
                      <span style={styles.itemSubtotal}>{formatPrice(lineTotal)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 2. DELIVERY ADDRESS & CONTACT ───────────────────────── */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} color="var(--coral)" />
                <h2 style={styles.cardTitle}>Shipping & Delivery Address</h2>
              </div>
              {!isEditingDelivery && (
                <button
                  type="button"
                  style={styles.editToggleBtn}
                  onClick={() => setIsEditingDelivery(true)}
                >
                  <Edit3 size={13} />
                  <span>Change Address</span>
                </button>
              )}
            </div>

            {!isEditingDelivery ? (
              <div style={styles.addressBox}>
                <div style={styles.recipientRow}>
                  <div style={styles.addressLineItem}>
                    <User size={15} color="var(--slate)" />
                    <span style={{ fontWeight: '700', color: 'var(--ink)' }}>{delivery.fullName}</span>
                  </div>
                  <div style={styles.addressLineItem}>
                    <Phone size={15} color="var(--slate)" />
                    <span style={{ color: 'var(--ink)' }}>{delivery.phone}</span>
                  </div>
                </div>

                <div style={styles.destinationRow}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <MapPin size={16} color="var(--coral)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--ink)' }}>
                        {delivery.street}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--slate)', marginTop: '2px' }}>
                        {delivery.city}, {delivery.state} – {delivery.postalCode}, {delivery.country}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={styles.deliveryBadge}>
                  <Truck size={14} color="var(--sage)" />
                  <span>Free Express Delivery (Guaranteed 2–3 Business Days Dispatch)</span>
                </div>
              </div>
            ) : (
              /* Inline Address Edit Form */
              <div style={styles.addressForm}>
                <div style={styles.formRowTwo}>
                  <div>
                    <label style={styles.formLabel}>Full Name / Recipient</label>
                    <input
                      type="text"
                      placeholder="Alex Rivera"
                      value={delivery.fullName}
                      onChange={(e) => setDelivery({ ...delivery, fullName: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                  <div>
                    <label style={styles.formLabel}>Contact Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={delivery.phone}
                      onChange={(e) => setDelivery({ ...delivery, phone: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                </div>

                <div>
                  <label style={styles.formLabel}>Street Address / Flat / Building</label>
                  <input
                    type="text"
                    placeholder="123 Tech Residency, 4th Cross Road"
                    value={delivery.street}
                    onChange={(e) => setDelivery({ ...delivery, street: e.target.value })}
                    style={styles.formInput}
                  />
                </div>

                <div style={styles.formRowThree}>
                  <div>
                    <label style={styles.formLabel}>City</label>
                    <input
                      type="text"
                      placeholder="Bengaluru"
                      value={delivery.city}
                      onChange={(e) => setDelivery({ ...delivery, city: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                  <div>
                    <label style={styles.formLabel}>State</label>
                    <input
                      type="text"
                      placeholder="Karnataka"
                      value={delivery.state}
                      onChange={(e) => setDelivery({ ...delivery, state: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                  <div>
                    <label style={styles.formLabel}>PIN Code</label>
                    <input
                      type="text"
                      placeholder="560034"
                      value={delivery.postalCode}
                      onChange={(e) => setDelivery({ ...delivery, postalCode: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                </div>

                <div style={styles.saveCheckRow}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={saveToProfile}
                      onChange={(e) => setSaveToProfile(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>Save this address to my profile as default</span>
                  </label>
                </div>

                <div style={styles.formBtnGroup}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveDelivery}
                    style={{ fontSize: '13px', padding: '8px 18px' }}
                  >
                    Confirm Address
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsEditingDelivery(false)}
                    style={{ fontSize: '13px', padding: '8px 18px' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary & Razorpay Trigger */}
        <div style={styles.sideCol}>
          <div style={styles.summaryCard}>
            <h2 style={styles.summaryTitle}>Payment Summary</h2>

            {/* Policy Autonomy Indicator */}
            <div
              style={{
                ...styles.policyBadge,
                background: isTier1 ? '#dcfce7' : isTier2 ? '#fef9c3' : '#e0f2fe',
                borderColor: isTier1 ? '#bbf7d0' : isTier2 ? '#fef08a' : '#bae6fd'
              }}
            >
              <ShieldCheck size={16} color={isTier1 ? '#16a34a' : isTier2 ? '#ca8a04' : '#0284c7'} />
              <span style={{ color: isTier1 ? '#15803d' : isTier2 ? '#854d0e' : '#0369a1' }}>
                {isTier1
                  ? 'Tier 1: Standard Verified Checkout'
                  : isTier2
                  ? 'Tier 2: Explicit Buyer Confirmation Active'
                  : 'Tier 3: Manual Direct Checkout Active'}
              </span>
            </div>

            {/* Breakdown */}
            <div style={styles.calcRows}>
              <div style={styles.calcRow}>
                <span style={{ color: 'var(--slate)' }}>
                  Items Subtotal ({cartCount} {cartCount === 1 ? 'item' : 'items'})
                </span>
                <span style={{ fontWeight: '600', color: 'var(--ink)' }}>{formatPrice(cartTotal)}</span>
              </div>
              <div style={styles.calcRow}>
                <span style={{ color: 'var(--slate)' }}>Fulfillment & Shipping</span>
                <span style={{ color: 'var(--sage)', fontWeight: '600' }}>Free Express Delivery</span>
              </div>
              <div style={styles.calcRow}>
                <span style={{ color: 'var(--slate)' }}>Taxes (GST Included)</span>
                <span style={{ color: 'var(--slate)', fontSize: '13px' }}>₹0 extra</span>
              </div>

              <div style={styles.divider} />

              <div style={styles.totalRow}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--ink)' }}>Total Payable</div>
                  <div style={{ fontSize: '12px', color: 'var(--slate)' }}>Includes all applicable taxes</div>
                </div>
                <div style={styles.grandTotalText}>{formatPrice(cartTotal)}</div>
              </div>
            </div>

            {/* Destination Snapshot */}
            <div style={styles.destinationSnapshot}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <MapPin size={13} color="var(--coral)" />
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ink)' }}>Shipping to:</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--slate)', lineHeight: '1.4' }}>
                <strong>{delivery.fullName}</strong> • {delivery.city}, {delivery.postalCode}
              </div>
            </div>

            {/* Razorpay Checkout Trigger */}
            <button
              type="button"
              className="btn btn-primary"
              style={styles.payBtn}
              disabled={isProcessing}
              onClick={handlePayWithRazorpay}
            >
              <CreditCard size={18} />
              <span>
                {isProcessing
                  ? 'Connecting to Razorpay…'
                  : `Confirm & Pay with Razorpay • ${formatPrice(cartTotal)}`}
              </span>
            </button>

            {/* Trust and Safety Badges */}
            <div style={styles.trustFooter}>
              <div style={styles.trustItem}>
                <CheckCircle2 size={13} color="var(--sage)" />
                <span>HMAC-SHA256 signature verification enabled</span>
              </div>
              <div style={styles.trustItem}>
                <Lock size={13} color="var(--slate)" />
                <span>256-bit encrypted Razorpay checkout gateway</span>
              </div>
            </div>

            <button
              type="button"
              style={styles.cancelLink}
              onClick={() => navigate('/cart')}
            >
              Modify Cart Items
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  topBar: {
    marginBottom: '16px'
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
    padding: 0
  },
  stepperContainer: {
    background: 'var(--white)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '16px 24px',
    marginBottom: '24px',
    boxShadow: 'var(--shadow-sm)'
  },
  stepperWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '700px',
    margin: '0 auto',
    gap: '12px'
  },
  stepItemDone: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
    cursor: 'pointer'
  },
  stepCircleDone: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'var(--sage)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepLabelDone: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--sage)'
  },
  stepLineDone: {
    flex: 1,
    height: '2px',
    background: 'var(--sage)',
    minWidth: '30px'
  },
  stepItemActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  stepCircleActive: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'var(--coral)',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepLabelActive: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--coral)'
  },
  stepLineUpcoming: {
    flex: 1,
    height: '2px',
    background: 'var(--border)',
    minWidth: '30px'
  },
  stepItemUpcoming: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  stepCircleUpcoming: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'var(--cream)',
    border: '1px solid var(--border)',
    color: 'var(--slate)',
    fontSize: '12px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepLabelUpcoming: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--slate)'
  },
  titleRow: {
    marginBottom: '24px'
  },
  pageTitle: {
    fontFamily: 'var(--font-brand)',
    fontSize: '28px',
    fontWeight: '700',
    color: 'var(--ink)'
  },
  pageSubtitle: {
    fontSize: '14px',
    color: 'var(--slate)',
    marginTop: '4px'
  },
  alertBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    background: 'var(--rust-bg)',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    padding: '14px 18px',
    marginBottom: '24px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: '24px',
    alignItems: 'start'
  },
  mainCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  card: {
    background: 'var(--white)',
    border: '1px solid var(--border)',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: 'var(--shadow-sm)'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '18px',
    paddingBottom: '14px',
    borderBottom: '1px solid var(--border)'
  },
  cardTitle: {
    fontFamily: 'var(--font-brand)',
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--ink)'
  },
  countBadge: {
    fontSize: '12px',
    fontWeight: '700',
    background: 'var(--cream)',
    color: 'var(--coral-dark)',
    border: '1px solid var(--border)',
    padding: '2px 8px',
    borderRadius: '12px'
  },
  editLink: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--coral)',
    textDecoration: 'none'
  },
  editToggleBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    background: 'none',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '5px 10px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--ink)',
    cursor: 'pointer'
  },
  itemList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    paddingBottom: '16px',
    borderBottom: '1px dashed var(--border)'
  },
  thumbWrap: {
    width: '64px',
    height: '64px',
    borderRadius: '12px',
    background: '#f8fafc',
    overflow: 'hidden',
    flexShrink: 0,
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  thumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  itemInfo: {
    flex: 1
  },
  categoryPill: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    padding: '2px 6px',
    borderRadius: '6px',
    color: 'var(--ink)',
    display: 'inline-block',
    marginBottom: '4px'
  },
  itemName: {
    display: 'block',
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--ink)',
    textDecoration: 'none'
  },
  itemMeta: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    color: 'var(--slate)',
    marginTop: '4px'
  },
  qtyBadge: {
    background: 'var(--cream)',
    color: 'var(--ink)',
    fontWeight: '600',
    padding: '1px 6px',
    borderRadius: '6px',
    fontSize: '12px'
  },
  itemPriceCol: {
    textAlign: 'right'
  },
  itemSubtotal: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--ink)'
  },
  addressBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  recipientRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--border)'
  },
  addressLineItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px'
  },
  destinationRow: {
    padding: '8px 0'
  },
  deliveryBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--sage-bg)',
    color: '#166534',
    padding: '8px 12px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '600'
  },
  addressForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  formRowTwo: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  formRowThree: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '12px'
  },
  formLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--ink)',
    marginBottom: '4px'
  },
  formInput: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    fontSize: '13px',
    outline: 'none',
    background: '#ffffff'
  },
  saveCheckRow: {
    marginTop: '4px'
  },
  checkboxLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: 'var(--ink)',
    cursor: 'pointer'
  },
  formBtnGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '8px'
  },
  sideCol: {
    position: 'sticky',
    top: '24px'
  },
  summaryCard: {
    background: 'var(--white)',
    border: '1px solid var(--border)',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: 'var(--shadow-md)'
  },
  summaryTitle: {
    fontFamily: 'var(--font-brand)',
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--ink)',
    marginBottom: '14px'
  },
  policyBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '12px',
    border: '1px solid',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '18px',
    lineHeight: '1.4'
  },
  calcRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '18px'
  },
  calcRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px'
  },
  divider: {
    height: '1px',
    background: 'var(--border)',
    margin: '6px 0'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingTop: '6px'
  },
  grandTotalText: {
    fontSize: '22px',
    fontWeight: '800',
    color: 'var(--coral-dark)',
    fontFamily: 'var(--font-brand)'
  },
  destinationSnapshot: {
    background: 'var(--cream)',
    borderRadius: '10px',
    padding: '10px 12px',
    marginBottom: '18px',
    border: '1px solid rgba(239, 232, 218, 0.9)'
  },
  payBtn: {
    width: '100%',
    padding: '14px 18px',
    fontSize: '14px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: '14px',
    boxShadow: '0 4px 14px rgba(240, 101, 74, 0.3)',
    cursor: 'pointer'
  },
  trustFooter: {
    marginTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  trustItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: 'var(--slate)'
  },
  cancelLink: {
    display: 'block',
    width: '100%',
    textAlign: 'center',
    background: 'none',
    border: 'none',
    color: 'var(--slate)',
    fontSize: '12px',
    fontWeight: '600',
    marginTop: '12px',
    cursor: 'pointer'
  },
  emptyCard: {
    background: 'var(--white)',
    borderRadius: '24px',
    padding: '60px 24px',
    textAlign: 'center',
    border: '1px solid rgba(239, 232, 218, 0.9)',
    boxShadow: 'var(--shadow-sm)',
    maxWidth: '520px',
    margin: '60px auto'
  },
  emptyIconWrap: {
    width: '80px',
    height: '80px',
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
    lineHeight: '1.5',
    marginBottom: '24px'
  }
};
