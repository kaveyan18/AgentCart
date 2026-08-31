import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Sparkles, ShoppingBag, Heart, User, Search, ShieldCheck } from 'lucide-react';

export default function Nav() {
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
          Storefront
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
            <ShieldCheck size={15} color="var(--sage)" /> Merchant Console
          </span>
        </NavLink>
      </div>

      <div style={styles.searchBox}>
        <Search size={15} color="var(--slate)" />
        <input
          type="text"
          placeholder="Search products or ask AI..."
          style={styles.searchInput}
        />
      </div>

      <div style={styles.actions}>
        <Link to="/orders" title="Wishlist" style={styles.actionBtn}>
          <Heart size={19} />
        </Link>
        <Link to="/orders" title="Cart & Orders" style={styles.actionBtn}>
          <ShoppingBag size={19} />
        </Link>
        <div title="Account" style={styles.actionBtn}>
          <User size={19} />
        </div>
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
    border: '1px solid rgba(239, 232, 218, 0.7)'
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
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--cream)',
    borderRadius: 'var(--r-md)',
    padding: '8px 16px',
    width: '260px',
    border: '1.5px solid transparent',
    transition: 'all 0.2s ease'
  },
  searchInput: {
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: '13px',
    color: 'var(--ink)',
    width: '100%'
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
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'var(--cream)',
    color: 'var(--ink)',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'transform 0.15s ease, background 0.15s ease'
  }
};
