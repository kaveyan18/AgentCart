import React, { useEffect, useState } from 'react';
import {
  Smartphone,
  Headphones,
  Zap,
  Shield,
  Cable,
  Laptop,
  Sparkles,
  Bot,
  ShieldCheck,
  Truck,
  RotateCcw
} from 'lucide-react';
import Nav from '../components/Nav';
import ProductCard from '../components/ProductCard';
import { getProducts } from '../api/client';
import { useChat } from '../context/ChatContext';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { openChatWithPrompt } = useChat();

  useEffect(() => {
    async function fetchCatalog() {
      try {
        setLoading(true);
        const data = await getProducts();
        setProducts(data);
      } catch (err) {
        console.error('Failed to load products:', err);
        setError('Could not connect to the product catalog.');
      } finally {
        setLoading(false);
      }
    }
    fetchCatalog();
  }, []);

  return (
    <div className="page">
      <Nav />

      {/* Hero Banner with Studio Tech Photography */}
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.heroPill}>
            <Sparkles size={13} color="var(--sage)" />
            <span>AgentCart · AI-Powered Commerce</span>
          </div>

          <h1 style={styles.heroTitle}>
            Shop, chat, checkout — all in one conversation.
          </h1>

          <p style={styles.heroSubtitle}>
            Our autonomous AI agent finds the perfect accessories, applies smart merchant rules, and initiates instant Razorpay payments.
          </p>

          <div style={styles.heroBtns}>
            <button
              className="btn btn-primary"
              onClick={() => openChatWithPrompt('I need a phone case and fast charger')}
            >
              <Bot size={16} color="#fff" />
              <span>Ask AI Assistant</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Browse Catalog
            </button>
          </div>

          <div style={styles.trustBadges}>
            <div style={styles.trustItem}>
              <ShieldCheck size={16} color="var(--sage)" />
              <span>Gate Verified</span>
            </div>
            <div style={styles.trustItem}>
              <Truck size={16} color="var(--coral)" />
              <span>Express Delivery</span>
            </div>
            <div style={styles.trustItem}>
              <RotateCcw size={16} color="var(--mustard)" />
              <span>7-Day Returns</span>
            </div>
          </div>
        </div>

        <div style={styles.heroMedia}>
          <img
            src="/images/hero_banner.jpg"
            alt="AgentCart Studio Tech Accessories"
            style={styles.heroImage}
          />
          <div style={styles.heroFloatingBadge}>
            <div style={styles.floatingAvatar}>
              <Bot size={18} color="#fff" />
            </div>
            <div>
              <div style={styles.floatingTitle}>AI Concierge Online</div>
              <div style={styles.floatingDesc}>Ready to recommend & bundle</div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="section-title" style={{ marginTop: '36px' }}>Shop by category</div>
      <div style={styles.cats}>
        <div
          style={{ ...styles.cat, background: 'var(--coral)' }}
          onClick={() => openChatWithPrompt('Show me iPhone 15 silicone cases')}
        >
          <Smartphone size={17} color="#fff" />
          <span>Cases</span>
        </div>
        <div
          style={{ ...styles.cat, background: 'var(--sage)' }}
          onClick={() => openChatWithPrompt('What noise cancelling headphones do you have?')}
        >
          <Headphones size={17} color="#fff" />
          <span>Audio</span>
        </div>
        <div
          style={{ ...styles.cat, background: 'var(--pink)' }}
          onClick={() => openChatWithPrompt('Show me GaN fast chargers')}
        >
          <Zap size={17} color="#fff" />
          <span>Chargers</span>
        </div>
        <div
          style={{ ...styles.cat, background: 'var(--mustard)', color: 'var(--ink)' }}
          onClick={() => openChatWithPrompt('Show me tempered glass screen protectors')}
        >
          <Shield size={17} color="var(--ink)" />
          <span>Protectors</span>
        </div>
        <div
          style={{ ...styles.cat, background: 'var(--lavender)' }}
          onClick={() => openChatWithPrompt('Show me high speed braided USB-C cables')}
        >
          <Cable size={17} color="#fff" />
          <span>Cables</span>
        </div>
        <div
          style={{ ...styles.cat, background: 'var(--sage-bg)', color: 'var(--ink)' }}
          onClick={() => openChatWithPrompt('Show me ergonomic workspace accessories')}
        >
          <Laptop size={17} color="var(--ink)" />
          <span>Workspace</span>
        </div>
      </div>

      {/* Popular Products Section */}
      <div id="catalog-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', marginTop: '28px' }}>
        <div className="section-title" style={{ margin: 0 }}>Featured Gear</div>
        <span style={{ fontSize: '13px', color: 'var(--slate)' }}>
          {products.length} products available
        </span>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : error ? (
        <div className="empty-state">
          <h3>Error loading products</h3>
          <p>{error}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <h3>No products in catalog</h3>
          <p>Run the backend seed script to populate products.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {products.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  hero: {
    background: 'linear-gradient(135deg, var(--sage-bg) 0%, #edf5ef 100%)',
    borderRadius: '28px',
    padding: '36px 44px',
    marginBottom: '28px',
    display: 'grid',
    gridTemplateColumns: '1.1fr 1fr',
    gap: '36px',
    alignItems: 'center',
    border: '1px solid rgba(143, 175, 151, 0.25)',
    boxShadow: '0 8px 30px rgba(58, 63, 82, 0.05)'
  },
  heroContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  heroPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'var(--white)',
    borderRadius: '20px',
    padding: '6px 14px',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--ink)',
    boxShadow: 'var(--shadow-sm)',
    width: 'fit-content'
  },
  heroTitle: {
    fontFamily: 'var(--font-brand)',
    fontSize: '38px',
    fontWeight: '700',
    lineHeight: 1.15,
    color: 'var(--ink)'
  },
  heroSubtitle: {
    fontSize: '14.5px',
    lineHeight: 1.6,
    color: 'var(--slate)',
    maxWidth: '460px'
  },
  heroBtns: {
    display: 'flex',
    gap: '14px',
    marginTop: '6px'
  },
  trustBadges: {
    display: 'flex',
    gap: '20px',
    marginTop: '10px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(143, 175, 151, 0.3)'
  },
  trustItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--ink)'
  },
  heroMedia: {
    position: 'relative',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-lg)',
    height: '320px',
    background: 'var(--white)'
  },
  heroImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  heroFloatingBadge: {
    position: 'absolute',
    bottom: '14px',
    left: '14px',
    background: 'rgba(255, 255, 255, 0.94)',
    backdropFilter: 'blur(8px)',
    borderRadius: '14px',
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: 'var(--shadow-md)',
    border: '1px solid rgba(255, 255, 255, 0.6)'
  },
  floatingAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    background: 'var(--coral)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  floatingTitle: {
    fontSize: '12.5px',
    fontWeight: '700',
    color: 'var(--ink)'
  },
  floatingDesc: {
    fontSize: '10.5px',
    color: 'var(--slate)'
  },
  cats: {
    display: 'flex',
    gap: '12px',
    marginBottom: '28px',
    flexWrap: 'wrap'
  },
  cat: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '11px 18px',
    borderRadius: '14px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '20px'
  }
};
