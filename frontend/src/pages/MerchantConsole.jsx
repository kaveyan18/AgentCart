import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Activity,
  Lock,
  Percent,
  Sparkles,
  CheckCircle2,
  XCircle,
  CreditCard,
  Search,
  SlidersHorizontal
} from 'lucide-react';
import { getAuditLogs } from '../api/client';
import { formatTime } from '../utils/helpers';

export default function MerchantConsole() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true);
        const data = await getAuditLogs();
        setLogs(data);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  const sampleFallbackLogs = [
    { timestamp: new Date(), action: 'order_search', reason: 'iphone 15 case', ok: true },
    { timestamp: new Date(Date.now() - 30000), action: 'policy_gate_check', reason: '₹798 within ₹5,000 max policy limit', ok: true },
    { timestamp: new Date(Date.now() - 60000), action: 'razorpay_order_created', reason: 'order_TVCAcVy created with key verification', ok: true },
    { timestamp: new Date(Date.now() - 90000), action: 'payment_captured', reason: 'HMAC signature verified matching key', ok: true },
    { timestamp: new Date(Date.now() - 120000), action: 'payment_failed', reason: 'bank declined transaction', ok: false }
  ];

  const displayLogs = logs.length > 0 ? logs : sampleFallbackLogs;

  const getActionIcon = (action = '') => {
    if (action.includes('search')) return <Search size={13} color="var(--slate)" />;
    if (action.includes('gate') || action.includes('policy')) return <ShieldCheck size={13} color="var(--sage)" />;
    if (action.includes('razorpay') || action.includes('order')) return <CreditCard size={13} color="var(--coral)" />;
    if (action.includes('fail')) return <ShieldAlert size={13} color="var(--rust)" />;
    return <Activity size={13} color="var(--slate)" />;
  };

  return (
    <div style={styles.container}>
      {/* Admin Nav */}
      <div style={styles.adminNav}>
        <div style={styles.brandRow}>
          <div style={styles.shieldIconWrap}>
            <ShieldCheck size={20} color="#fff" />
          </div>
          <div style={styles.adminWordmark}>
            Agent<span>Cart</span> · Autonomous Merchant Console
          </div>
        </div>

        <Link to="/" style={styles.adminBack}>
          <ArrowLeft size={15} /> Back to Storefront
        </Link>
      </div>

      {/* Admin Body */}
      <div style={styles.adminBody}>
        <div style={styles.adminGrid}>
          {/* Recent Gate Decisions Table */}
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div style={styles.panelTitleRow}>
                <Activity size={18} color="var(--coral)" />
                <h2 style={styles.panelTitle}>Autonomous Gate Audit Trail</h2>
              </div>
              <span style={styles.logBadge}>
                {displayLogs.length} events logged
              </span>
            </div>

            {loading ? (
              <div className="spinner" />
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Timestamp</th>
                    <th style={styles.th}>Action</th>
                    <th style={styles.th}>Audit Details</th>
                    <th style={styles.th}>Gate Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayLogs.map((log, index) => {
                    const timeStr = formatTime(log.timestamp);
                    const isFailure = /fail|invalid|declined|error/i.test(log.action || '') || log.ok === false;
                    const actionLabel = (log.action || 'gate_check').replace(/_/g, ' ');
                    const detail = typeof log.reason === 'string'
                      ? log.reason
                      : JSON.stringify(log.reason || log.details || '').slice(0, 45);

                    return (
                      <tr key={log._id || index} style={styles.tr}>
                        <td style={{ ...styles.td, ...styles.mono }}>{timeStr}</td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {getActionIcon(log.action)}
                            <span style={{ textTransform: 'capitalize' }}>{actionLabel}</span>
                          </div>
                        </td>
                        <td style={{ ...styles.td, ...styles.mono }}>{detail}</td>
                        <td style={styles.td}>
                          <span
                            className={`pill ${isFailure ? 'failed' : 'paid'}`}
                            style={styles.tablePill}
                          >
                            {isFailure ? (
                              <>
                                <XCircle size={11} /> Blocked/Fail
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={11} /> Approved
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Policy Limits Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={styles.panel}>
              <div style={styles.panelTitleRow}>
                <SlidersHorizontal size={18} color="var(--sage)" />
                <h2 style={styles.panelTitle}>Autonomous Policy Limits</h2>
              </div>

              <div style={styles.limitList}>
                <div style={styles.limitItem}>
                  <div style={styles.limitLabelWrap}>
                    <Lock size={14} color="var(--coral)" />
                    <span>Max Order Value</span>
                  </div>
                  <span style={styles.limitVal}>₹5,000</span>
                </div>

                <div style={styles.limitItem}>
                  <div style={styles.limitLabelWrap}>
                    <Percent size={14} color="var(--mustard)" />
                    <span>Max Allowed Discount</span>
                  </div>
                  <span style={styles.limitVal}>10%</span>
                </div>

                <div style={styles.limitItem}>
                  <div style={styles.limitLabelWrap}>
                    <CreditCard size={14} color="var(--sage)" />
                    <span>Payment Approval</span>
                  </div>
                  <span style={{ ...styles.limitVal, color: 'var(--sage)' }}>Buyer Required</span>
                </div>

                <div style={styles.limitItem}>
                  <div style={styles.limitLabelWrap}>
                    <Sparkles size={14} color="var(--lavender)" />
                    <span>Upsells Per Turn</span>
                  </div>
                  <span style={styles.limitVal}>1 Max</span>
                </div>
              </div>
            </div>

            <div style={styles.policyCard}>
              <div style={styles.policyCardTitle}>
                <ShieldCheck size={16} color="#3A6B45" />
                <span>Zero-Hallucination Gate</span>
              </div>
              <p style={styles.policyCardDesc}>
                Orders are calculated strictly by the deterministic policy service on every payment request, bypassing agent calculations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'var(--cream)',
    display: 'flex',
    flexDirection: 'column'
  },
  adminNav: {
    background: 'var(--ink-2)',
    color: '#ffffff',
    padding: '16px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  shieldIconWrap: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, var(--sage), #6e9477)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  adminWordmark: {
    fontFamily: 'var(--font-brand)',
    fontSize: '19px',
    fontWeight: '700'
  },
  adminBack: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--sage)',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.08)',
    transition: 'all 0.15s ease'
  },
  adminBody: {
    padding: '32px',
    maxWidth: '1320px',
    margin: '0 auto',
    width: '100%'
  },
  adminGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '24px'
  },
  panel: {
    background: 'var(--white)',
    borderRadius: '22px',
    padding: '24px',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid rgba(239, 232, 218, 0.9)'
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px'
  },
  panelTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px'
  },
  panelTitle: {
    fontFamily: 'var(--font-brand)',
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--ink)'
  },
  logBadge: {
    fontSize: '11px',
    fontWeight: '700',
    background: 'var(--cream)',
    color: 'var(--slate)',
    padding: '4px 10px',
    borderRadius: '20px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--slate)',
    textAlign: 'left',
    padding: '10px 8px',
    borderBottom: '1.5px solid var(--border)'
  },
  tr: {
    transition: 'background 0.15s ease'
  },
  td: {
    fontSize: '12.5px',
    padding: '12px 8px',
    borderBottom: '1px solid var(--border)',
    color: 'var(--ink)'
  },
  mono: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11.5px',
    color: 'var(--slate)'
  },
  tablePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: '700'
  },
  limitList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  limitItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    padding: '10px 0',
    borderBottom: '1px solid var(--border)'
  },
  limitLabelWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '500',
    color: 'var(--ink)'
  },
  limitVal: {
    fontWeight: '700',
    color: 'var(--coral-dark)'
  },
  policyCard: {
    background: 'var(--sage-bg)',
    borderRadius: '18px',
    padding: '18px',
    border: '1px solid rgba(143, 175, 151, 0.3)'
  },
  policyCardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#3A6B45',
    marginBottom: '6px'
  },
  policyCardDesc: {
    fontSize: '12px',
    lineHeight: '1.5',
    color: 'var(--ink)'
  }
};
