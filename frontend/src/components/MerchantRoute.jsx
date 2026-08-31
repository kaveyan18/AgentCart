import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';
import Nav from './Nav';

export default function MerchantRoute({ children }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ color: 'var(--slate)', fontSize: '15px' }}>Verifying merchant session...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  if (user?.role !== 'merchant') {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px 60px' }}>
        <Nav />
        <div style={styles.deniedCard}>
          <div style={styles.iconCircle}>
            <ShieldAlert size={36} color="var(--rust)" />
          </div>
          <h2 style={styles.title}>Merchant Privileges Required</h2>
          <p style={styles.desc}>
            You are currently signed in as <strong>{user?.name || user?.email}</strong> (Role: <code style={styles.roleCode}>{user?.role || 'buyer'}</code>).
            The Autonomous Merchant Console and Catalog Management require a verified Merchant account.
          </p>

          <div style={styles.btnRow}>
            <Link to="/" style={styles.backBtn}>
              <ArrowLeft size={16} /> Return to Storefront
            </Link>
            <button
              onClick={() => {
                logout();
                window.location.href = '/login?redirect=/admin';
              }}
              style={styles.switchBtn}
            >
              <LogIn size={16} /> Sign In as Merchant
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

const styles = {
  deniedCard: {
    background: 'var(--white)',
    borderRadius: '24px',
    padding: '48px 32px',
    maxWidth: '560px',
    margin: '40px auto',
    textAlign: 'center',
    boxShadow: 'var(--shadow-md)',
    border: '1px solid rgba(239, 232, 218, 0.95)'
  },
  iconCircle: {
    width: '68px',
    height: '68px',
    borderRadius: '20px',
    background: '#fff2f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    border: '1px solid #ffccc7'
  },
  title: {
    fontFamily: 'var(--font-brand)',
    fontSize: '24px',
    fontWeight: '700',
    color: 'var(--ink)',
    marginBottom: '10px'
  },
  desc: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: 'var(--slate)',
    marginBottom: '28px'
  },
  roleCode: {
    background: 'var(--cream)',
    padding: '2px 8px',
    borderRadius: '6px',
    color: 'var(--ink)',
    fontWeight: '700'
  },
  btnRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    flexWrap: 'wrap'
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '11px 18px',
    borderRadius: '12px',
    background: 'var(--cream)',
    color: 'var(--ink)',
    textDecoration: 'none',
    fontSize: '13.5px',
    fontWeight: '600'
  },
  switchBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '11px 18px',
    borderRadius: '12px',
    background: 'var(--coral)',
    color: '#fff',
    border: 'none',
    fontSize: '13.5px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(240, 101, 74, 0.25)'
  }
};
