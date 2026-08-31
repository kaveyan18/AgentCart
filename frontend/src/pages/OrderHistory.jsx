import React, { useEffect, useState } from 'react';
import { ShoppingBag, Calendar, CheckCircle2, XCircle, Clock, ArrowRight, Package } from 'lucide-react';
import Nav from '../components/Nav';
import { getOrderHistory } from '../api/client';
import { formatPrice, formatDate, getProductImage } from '../utils/helpers';
import { useChat } from '../context/ChatContext';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { openChatWithPrompt } = useChat();

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        const data = await getOrderHistory();
        setOrders(data);
      } catch (err) {
        console.error('Failed to load order history:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  return (
    <div className="page">
      <Nav />

      <div style={styles.headerRow}>
        <div>
          <h1 className="section-title" style={{ margin: 0 }}>Your Order History</h1>
          <p style={styles.headerSub}>Track and review all purchases and AI-assisted checkouts</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => openChatWithPrompt('I want to place a new order')}
        >
          <ShoppingBag size={15} color="#fff" />
          <span>New AI Order</span>
        </button>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div style={styles.emptyIconWrap}>
            <Package size={36} color="var(--slate)" />
          </div>
          <h3>No orders found</h3>
          <p>You haven't placed any orders yet. Chat with AgentCart AI to get started!</p>
          <button
            className="btn btn-primary"
            style={{ marginTop: '16px' }}
            onClick={() => openChatWithPrompt('I want to find a phone case')}
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div style={styles.ordersList}>
          {orders.map((order) => {
            const names = (order.items || []).map(i => i.name).join(' + ') || 'Order';
            const date = formatDate(order.createdAt);
            const statusClass = order.status === 'paid' ? 'paid' : order.status === 'failed' ? 'failed' : 'created';
            const statusLabel = order.status === 'paid' ? 'Paid' : order.status === 'failed' ? 'Failed' : 'Pending';

            return (
              <div key={order._id} style={styles.orderCard}>
                <div style={styles.orderLeft}>
                  <div style={styles.iconAvatar}>
                    <ShoppingBag size={18} color="var(--ink)" />
                  </div>
                  <div>
                    <div style={styles.orderName}>{names}</div>
                    <div style={styles.metaRow}>
                      <span style={styles.orderId}>#{String(order._id).slice(-8).toUpperCase()}</span>
                      <span style={styles.dot}>•</span>
                      <span style={styles.orderDate}>
                        <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        {date}
                      </span>
                      {order.errorReason && (
                        <>
                          <span style={styles.dot}>•</span>
                          <span style={styles.errorReason}>{order.errorReason}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div style={styles.orderRight}>
                  <span style={styles.orderTotal}>{formatPrice(order.total || 0)}</span>
                  <div className={`pill ${statusClass}`} style={styles.statusPill}>
                    {order.status === 'paid' ? (
                      <CheckCircle2 size={12} style={{ marginRight: '4px' }} />
                    ) : order.status === 'failed' ? (
                      <XCircle size={12} style={{ marginRight: '4px' }} />
                    ) : (
                      <Clock size={12} style={{ marginRight: '4px' }} />
                    )}
                    <span>{statusLabel}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px'
  },
  headerSub: {
    fontSize: '13px',
    color: 'var(--slate)',
    marginTop: '2px'
  },
  emptyIconWrap: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'var(--cream)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px'
  },
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  orderCard: {
    background: 'var(--white)',
    borderRadius: '18px',
    padding: '18px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid rgba(239, 232, 218, 0.85)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
  },
  orderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  iconAvatar: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background: 'var(--cream)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  orderName: {
    fontSize: '14.5px',
    fontWeight: '600',
    color: 'var(--ink)',
    marginBottom: '4px'
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: 'var(--slate)'
  },
  orderId: {
    fontFamily: 'var(--font-mono)',
    fontWeight: '600'
  },
  dot: {
    color: 'var(--border)'
  },
  orderDate: {
    display: 'flex',
    alignItems: 'center'
  },
  errorReason: {
    color: 'var(--rust)',
    fontWeight: '500'
  },
  orderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px'
  },
  orderTotal: {
    fontFamily: 'var(--font-brand)',
    fontSize: '17px',
    fontWeight: '700',
    color: 'var(--ink)'
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center'
  }
};
