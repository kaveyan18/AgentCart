import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Mail, ShieldCheck, ShoppingBag, Calendar,
  CheckCircle2, XCircle, Clock, Sparkles, Package,
  TrendingUp, CreditCard, Star, ChevronRight,
  MapPin, Phone, Edit3, Save
} from 'lucide-react';
import Nav from '../components/Nav';
import { useAuth } from '../context/AuthContext';
import { getOrderHistory } from '../api/client';
import { formatPrice, formatDate } from '../utils/helpers';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Address & Contact Management State
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressSaved, setAddressSaved] = useState(false);
  const [addressForm, setAddressForm] = useState({
    phone: user?.phone || '+91 98765 43210',
    street: user?.shippingAddress?.street || '123 Tech Residency, 4th Cross Road',
    city: user?.shippingAddress?.city || 'Bengaluru',
    state: user?.shippingAddress?.state || 'Karnataka',
    postalCode: user?.shippingAddress?.postalCode || '560034',
    country: user?.shippingAddress?.country || 'India'
  });

  useEffect(() => {
    if (user) {
      setAddressForm({
        phone: user.phone || '+91 98765 43210',
        street: user.shippingAddress?.street || '123 Tech Residency, 4th Cross Road',
        city: user.shippingAddress?.city || 'Bengaluru',
        state: user.shippingAddress?.state || 'Karnataka',
        postalCode: user.shippingAddress?.postalCode || '560034',
        country: user.shippingAddress?.country || 'India'
      });
    }
  }, [user]);

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({
        phone: addressForm.phone,
        shippingAddress: {
          street: addressForm.street,
          city: addressForm.city,
          state: addressForm.state,
          postalCode: addressForm.postalCode,
          country: addressForm.country
        }
      });
      setIsEditingAddress(false);
      setAddressSaved(true);
      setTimeout(() => setAddressSaved(false), 3000);
    } catch (err) {
      alert(`Could not save address: ${err.message}`);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const data = await getOrderHistory();
        setOrders(data);
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const isMerchant = user?.role === 'merchant';

  // Stats derived from orders
  const paidOrders   = orders.filter(o => o.status === 'paid');
  const totalSpent   = paidOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  const pendingCount = orders.filter(o => o.status === 'created').length;
  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);

  // Avatar initials + color
  const initials   = user?.name ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'U';
  const avatarBg   = isMerchant
    ? 'linear-gradient(135deg, #4ade80, #16a34a)'
    : 'linear-gradient(135deg, var(--coral), var(--coral-dark))';

  // Member since (created date from token might not be available; fallback gracefully)
  const joinDate = user?.createdAt ? formatDate(user.createdAt) : 'Member';

  return (
    <div className="page">
      <Nav />

      {/* ── Hero Card ────────────────────────────────────── */}
      <div style={s.heroCard}>
        <div style={s.heroGlow} />

        <div style={s.heroLeft}>
          <div style={{ ...s.avatar, background: avatarBg }}>
            {initials}
          </div>
          <div>
            <div style={s.heroName}>{user?.name || 'User'}</div>
            <div style={s.heroEmail}>
              <Mail size={13} style={{ marginRight: '5px', opacity: 0.65 }} />
              {user?.email}
            </div>
            <div style={s.heroBadge}>
              {isMerchant ? (
                <span style={{ ...s.roleChip, background: '#dcfce7', color: '#16a34a' }}>
                  <ShieldCheck size={12} style={{ marginRight: '4px' }} />
                  Merchant Account
                </span>
              ) : (
                <span style={{ ...s.roleChip, background: 'var(--cream)', color: 'var(--slate)' }}>
                  <User size={12} style={{ marginRight: '4px' }} />
                  Customer Account
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={s.heroRight}>
          {isMerchant && (
            <Link to="/admin" style={s.consoleBtn}>
              <ShieldCheck size={15} />
              <span>Merchant Console</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── Stats Row ────────────────────────────────────── */}
      <div style={s.statsRow}>
        <StatCard
          icon={<ShoppingBag size={20} color="var(--coral)" />}
          label="Total Orders"
          value={orders.length}
          bg="rgba(240,101,74,0.08)"
        />
        <StatCard
          icon={<CreditCard size={20} color="#6366f1" />}
          label="Total Spent"
          value={formatPrice(totalSpent)}
          bg="rgba(99,102,241,0.08)"
        />
        <StatCard
          icon={<CheckCircle2 size={20} color="#16a34a" />}
          label="Completed"
          value={paidOrders.length}
          bg="rgba(22,163,74,0.08)"
        />
        <StatCard
          icon={<Clock size={20} color="#f59e0b" />}
          label="Pending"
          value={pendingCount}
          bg="rgba(245,158,11,0.08)"
        />
      </div>

      {/* ── Recent Orders ─────────────────────────────────── */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>
            <Package size={18} style={{ marginRight: '8px', color: 'var(--coral)' }} />
            Recent Orders
          </h2>
          <Link to="/orders" style={s.viewAll}>
            View All
            <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="spinner" style={{ margin: '32px auto' }} />
        ) : recentOrders.length === 0 ? (
          <div style={s.emptyBox}>
            <Package size={30} color="var(--slate)" />
            <p style={{ marginTop: '12px', color: 'var(--slate)', fontSize: '14px' }}>
              No orders yet. Start shopping with the AI assistant!
            </p>
          </div>
        ) : (
          <div style={s.orderList}>
            {recentOrders.map(order => {
              const names = (order.items || []).map(i => i.name).join(', ') || 'Order';
              const isPaid    = order.status === 'paid';
              const isFailed  = order.status === 'failed';

              return (
                <div key={order._id} style={s.orderRow}>
                  <div style={s.orderIcon}>
                    {isPaid
                      ? <CheckCircle2 size={16} color="#16a34a" />
                      : isFailed
                      ? <XCircle size={16} color="var(--rust)" />
                      : <Clock size={16} color="#f59e0b" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.orderName}>{names}</div>
                    <div style={s.orderMeta}>
                      <span style={s.orderId}>#{String(order._id).slice(-8).toUpperCase()}</span>
                      <span style={s.dot}>·</span>
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={s.orderTotal}>{formatPrice(order.total || 0)}</div>
                    <span style={{
                      ...s.statusBadge,
                      background: isPaid ? '#dcfce7' : isFailed ? '#fee2e2' : '#fef9c3',
                      color: isPaid ? '#16a34a' : isFailed ? '#dc2626' : '#b45309'
                    }}>
                      {isPaid ? 'Paid' : isFailed ? 'Failed' : 'Pending'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Account Info Card ──────────────────────────────── */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>
          <User size={18} style={{ marginRight: '8px', color: 'var(--coral)' }} />
          Account Details
        </h2>
        <div style={s.infoCard}>
          <InfoRow label="Full Name"     value={user?.name || '—'} />
          <InfoRow label="Email Address" value={user?.email || '—'} />
          <InfoRow label="Account Type"  value={isMerchant ? 'Merchant' : 'Customer'} />
        </div>
      </div>

      {/* ── Delivery Address & Contact Details Card ───────────── */}
      <div style={s.section}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ ...s.sectionTitle, marginBottom: 0 }}>
            <MapPin size={18} style={{ marginRight: '8px', color: 'var(--coral)' }} />
            Default Delivery & Contact Details
          </h2>
          <button
            type="button"
            onClick={() => setIsEditingAddress(!isEditingAddress)}
            style={s.editAddressBtn}
          >
            <Edit3 size={13} />
            <span>{isEditingAddress ? 'Cancel' : 'Edit Address'}</span>
          </button>
        </div>

        {addressSaved && (
          <div style={s.successBanner}>
            <CheckCircle2 size={15} color="var(--sage)" />
            <span>Delivery details saved to profile successfully!</span>
          </div>
        )}

        {!isEditingAddress ? (
          <div style={s.infoCard}>
            <InfoRow label="Contact Phone" value={user?.phone || addressForm.phone || '+91 98765 43210'} />
            <InfoRow label="Street Address" value={user?.shippingAddress?.street || addressForm.street || '123 Tech Residency, 4th Cross Road'} />
            <InfoRow label="City & State" value={`${user?.shippingAddress?.city || addressForm.city || 'Bengaluru'}, ${user?.shippingAddress?.state || addressForm.state || 'Karnataka'}`} />
            <InfoRow label="PIN / Postal Code" value={user?.shippingAddress?.postalCode || addressForm.postalCode || '560034'} />
            <InfoRow label="Country" value={user?.shippingAddress?.country || addressForm.country || 'India'} />
          </div>
        ) : (
          <form onSubmit={handleSaveAddress} style={s.addressForm}>
            <div style={s.formGrid}>
              <div style={s.formGroup}>
                <label style={s.label}>Contact Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  style={s.input}
                />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>PIN / Postal Code *</label>
                <input
                  type="text"
                  required
                  placeholder="560034"
                  value={addressForm.postalCode}
                  onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                  style={s.input}
                />
              </div>
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Street Address / Flat / Building *</label>
              <input
                type="text"
                required
                placeholder="Flat 402, Green Meadows, 12th Main Road"
                value={addressForm.street}
                onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                style={s.input}
              />
            </div>

            <div style={s.formGrid}>
              <div style={s.formGroup}>
                <label style={s.label}>City *</label>
                <input
                  type="text"
                  required
                  placeholder="Bengaluru"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  style={s.input}
                />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>State *</label>
                <input
                  type="text"
                  required
                  placeholder="Karnataka"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                  style={s.input}
                />
              </div>
            </div>

            <button type="submit" style={s.saveAddressBtn}>
              <Save size={15} />
              <span>Save Delivery Details</span>
            </button>
          </form>
        )}
      </div>

      {/* ── AI Tip Box ────────────────────────────────────── */}
      <div style={s.tipBox}>
        <Sparkles size={18} color="var(--coral)" style={{ flexShrink: 0 }} />
        <span style={s.tipText}>
          Use the <strong>AgentCart AI</strong> chat assistant anytime to browse products,
          check order status, or get personalised recommendations — just click the button
          in the bottom-right corner.
        </span>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────── */
function StatCard({ icon, label, value, bg }) {
  return (
    <div style={{ ...s.statCard, background: 'var(--white)' }}>
      <div style={{ ...s.statIcon, background: bg }}>{icon}</div>
      <div style={s.statValue}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={s.infoRow}>
      <span style={s.infoLabel}>{label}</span>
      <span style={s.infoValue}>{value}</span>
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────── */
const s = {
  /* Hero */
  heroCard: {
    position: 'relative',
    background: 'var(--white)',
    borderRadius: '24px',
    padding: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: 'var(--shadow-md, 0 4px 24px rgba(0,0,0,0.07))',
    border: '1px solid rgba(239,232,218,0.8)',
    marginBottom: '24px',
    overflow: 'hidden',
    gap: '20px',
  },
  heroGlow: {
    position: 'absolute',
    top: '-60px',
    right: '-60px',
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(240,101,74,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  avatar: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    color: '#fff',
    fontSize: '26px',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
    letterSpacing: '-1px',
  },
  heroName: {
    fontSize: '22px',
    fontWeight: '800',
    color: 'var(--ink)',
    lineHeight: '1.2',
    marginBottom: '4px',
  },
  heroEmail: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    color: 'var(--slate)',
    marginBottom: '10px',
  },
  heroBadge: {},
  roleChip: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '12px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '20px',
    textTransform: 'capitalize',
  },
  heroRight: {
    display: 'flex',
    flexShrink: 0,
  },
  consoleBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    padding: '10px 18px',
    borderRadius: '12px',
    background: '#dcfce7',
    color: '#16a34a',
    fontSize: '13.5px',
    fontWeight: '700',
    textDecoration: 'none',
    transition: 'opacity 0.15s ease',
  },

  /* Stats */
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    borderRadius: '18px',
    padding: '20px',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid rgba(239,232,218,0.85)',
  },
  statIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '14px',
  },
  statValue: {
    fontSize: '22px',
    fontWeight: '800',
    color: 'var(--ink)',
    lineHeight: '1',
    marginBottom: '5px',
    fontFamily: 'var(--font-brand)',
  },
  statLabel: {
    fontSize: '12px',
    color: 'var(--slate)',
    fontWeight: '500',
  },

  /* Section */
  section: {
    background: 'var(--white)',
    borderRadius: '20px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid rgba(239,232,218,0.85)',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--ink)',
    display: 'flex',
    alignItems: 'center',
    margin: '0 0 20px 0',
  },
  viewAll: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--coral)',
    textDecoration: 'none',
  },

  /* Orders */
  emptyBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px',
    color: 'var(--slate)',
  },
  orderList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  orderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 16px',
    borderRadius: '12px',
    transition: 'background 0.12s ease',
    cursor: 'default',
  },
  orderIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'var(--cream)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  orderName: {
    fontSize: '13.5px',
    fontWeight: '600',
    color: 'var(--ink)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '380px',
  },
  orderMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: 'var(--slate)',
    marginTop: '2px',
  },
  orderId: {
    fontFamily: 'var(--font-mono)',
    fontWeight: '600',
  },
  dot: { opacity: 0.5 },
  orderTotal: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--ink)',
    fontFamily: 'var(--font-brand)',
    marginBottom: '4px',
  },
  statusBadge: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '20px',
  },

  /* Account Info */
  infoCard: {
    border: '1px solid var(--cream)',
    borderRadius: '14px',
    overflow: 'hidden',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    borderBottom: '1px solid var(--cream)',
  },
  infoLabel: {
    fontSize: '13px',
    color: 'var(--slate)',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: '13.5px',
    fontWeight: '600',
    color: 'var(--ink)',
  },

  /* Address Management */
  editAddressBtn: {
    background: 'var(--cream)',
    border: '1px solid var(--sand)',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--coral-dark)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  successBanner: {
    background: '#dcfce7',
    color: '#16a34a',
    border: '1px solid #bbf7d0',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '12.5px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '14px',
  },
  addressForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--slate)',
  },
  input: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid var(--sand)',
    background: 'var(--cream)',
    fontSize: '13px',
    color: 'var(--ink)',
    outline: 'none',
  },
  saveAddressBtn: {
    alignSelf: 'flex-start',
    marginTop: '6px',
    background: 'linear-gradient(135deg, var(--coral), var(--coral-dark))',
    color: '#ffffff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 4px 12px rgba(240, 101, 74, 0.25)',
  },

  /* AI tip */
  tipBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    background: 'rgba(240,101,74,0.06)',
    border: '1px solid rgba(240,101,74,0.18)',
    borderRadius: '16px',
    padding: '16px 20px',
    marginBottom: '8px',
  },
  tipText: {
    fontSize: '13.5px',
    color: 'var(--ink)',
    lineHeight: '1.6',
  },
};
