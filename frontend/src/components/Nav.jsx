import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Sparkles, ShoppingBag, User, Search, ShieldCheck, LogOut, ChevronDown, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Nav() {
  const { user, isAuthenticated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const isMerchant = user?.role === 'merchant';

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brandGroup}>
        <div style={styles.logoBadge}>
          <Sparkles size={18} color="#fff" />
        </div>
        <div style={styles.wordmark}>
          Agent<span>Cart</span>
        </div>
      </Link>

      <div style={styles.links}>
        <NavLink
          to="/"
          style={({ isActive }) => ({
            ...styles.link,
            color: isActive ? 'var(--coral)' : 'var(--ink)',
            fontWeight: isActive ? '600' : '500'
          })}
        >
          Catalog
        </NavLink>
        <NavLink
          to="/orders"
          style={({ isActive }) => ({
            ...styles.link,
            color: isActive ? 'var(--coral)' : 'var(--ink)',
            fontWeight: isActive ? '600' : '500'
          })}
        >
          My Orders
        </NavLink>
        <NavLink
          to="/admin"
          style={({ isActive }) => ({
            ...styles.link,
            color: isActive ? 'var(--coral)' : 'var(--ink)',
            fontWeight: isActive ? '600' : '500'
          })}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <ShieldCheck size={15} color={isMerchant ? 'var(--sage)' : 'var(--slate)'} />
            <span>Merchant Console</span>
            {isMerchant && <span style={styles.merchantMiniBadge}>Owner</span>}
          </span>
        </NavLink>
      </div>

      <div style={styles.actions}>
        <Link to="/orders" title="My Orders" style={styles.actionBtn}>
          <ShoppingBag size={18} />
        </Link>

        {isAuthenticated ? (
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                ...styles.userProfileBtn,
                borderColor: isMerchant ? 'var(--sage)' : 'var(--sand)'
              }}
            >
              <div style={{
                ...styles.userAvatar,
                background: isMerchant ? 'var(--sage)' : 'var(--coral)'
              }}>
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={styles.userName}>{user?.name?.split(' ')[0] || 'Account'}</div>
              </div>
              <ChevronDown size={14} color="var(--slate)" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  style={styles.backdrop}
                  onClick={() => setDropdownOpen(false)}
                />
                <div style={styles.dropdown}>
                  <div style={styles.dropdownHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={styles.dropdownName}>{user?.name}</div>
                      <span style={{
                        ...styles.roleTag,
                        background: isMerchant ? 'var(--sage-bg)' : 'var(--cream)',
                        color: isMerchant ? 'var(--sage)' : 'var(--slate)'
                      }}>
                        {isMerchant ? '👑 Merchant' : '👤 Customer'}
                      </span>
                    </div>
                    <div style={styles.dropdownEmail}>{user?.email}</div>
                  </div>
                  <div style={styles.divider} />
                  <Link
                    to="/orders"
                    onClick={() => setDropdownOpen(false)}
                    style={styles.dropdownItem}
                  >
                    <ShoppingBag size={15} />
                    <span>My Order History</span>
                  </Link>
                  <Link
                    to="/admin"
                    onClick={() => setDropdownOpen(false)}
                    style={styles.dropdownItem}
                  >
                    <ShieldCheck size={15} color="var(--sage)" />
                    <span>Merchant Console</span>
                  </Link>
                  <div style={styles.divider} />
                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{ ...styles.dropdownItem, ...styles.logoutBtn }}
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div style={styles.authButtons}>
            <Link to="/login" style={styles.loginBtn}>
              <LogIn size={15} />
              <span>Sign In</span>
            </Link>
            <Link to="/signup" style={styles.signupBtn}>
              <UserPlus size={15} />
              <span>Register</span>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'var(--white)',
    borderRadius: '20px',
    padding: '12px 24px',
    marginBottom: '24px',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid rgba(239, 232, 218, 0.7)',
    position: 'relative',
    zIndex: 40
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none'
  },
  logoBadge: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, var(--coral), var(--coral-dark))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(240, 101, 74, 0.3)'
  },
  wordmark: {
    fontFamily: 'var(--font-brand)',
    fontSize: '22px',
    fontWeight: '700',
    color: 'var(--ink)'
  },
  links: {
    display: 'flex',
    gap: '24px',
    fontSize: '14px'
  },
  link: {
    textDecoration: 'none',
    transition: 'color 0.15s ease',
    padding: '6px 4px'
  },
  merchantMiniBadge: {
    fontSize: '10px',
    fontWeight: '700',
    background: 'var(--sage)',
    color: '#fff',
    padding: '2px 6px',
    borderRadius: '6px',
    textTransform: 'uppercase'
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px'
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '38px',
    height: '38px',
    borderRadius: '11px',
    background: 'var(--cream)',
    color: 'var(--ink)',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'transform 0.15s ease, background 0.15s ease'
  },
  userProfileBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '5px 12px 5px 6px',
    borderRadius: '24px',
    background: 'var(--cream)',
    border: '1.5px solid var(--sand)',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  userAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  userName: {
    fontSize: '13.5px',
    fontWeight: '600',
    color: 'var(--ink)'
  },
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 10px)',
    right: 0,
    width: '240px',
    background: 'var(--white)',
    borderRadius: '16px',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid rgba(239, 232, 218, 0.95)',
    padding: '8px',
    zIndex: 100,
    animation: 'fadeIn 0.15s ease'
  },
  dropdownHeader: {
    padding: '8px 12px 10px'
  },
  dropdownName: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--ink)'
  },
  roleTag: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '6px'
  },
  dropdownEmail: {
    fontSize: '12px',
    color: 'var(--slate)',
    marginTop: '2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  divider: {
    height: '1px',
    background: 'var(--cream)',
    margin: '4px 0'
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 12px',
    borderRadius: '8px',
    fontSize: '13.5px',
    color: 'var(--ink)',
    textDecoration: 'none',
    background: 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'background 0.12s ease'
  },
  logoutBtn: {
    color: 'var(--coral)'
  },
  authButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  loginBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '10px',
    fontSize: '13.5px',
    fontWeight: '600',
    color: 'var(--ink)',
    background: 'var(--cream)',
    textDecoration: 'none',
    transition: 'background 0.15s ease'
  },
  signupBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '10px',
    fontSize: '13.5px',
    fontWeight: '600',
    color: '#fff',
    background: 'var(--coral)',
    textDecoration: 'none',
    boxShadow: '0 3px 10px rgba(240, 101, 74, 0.25)',
    transition: 'all 0.15s ease'
  }
};
