import React, { useEffect, useState } from 'react';
import {
  Smartphone,
  Headphones,
  Zap,
  Laptop,
  Sparkles,
  Bot,
  ShieldCheck,
  Truck,
  RotateCcw,
  Watch,
  Camera,
  Layers,
  LayoutGrid
} from 'lucide-react';
import Nav from '../components/Nav';
import ProductCard from '../components/ProductCard';
import { getProducts } from '../api/client';
import { useChat } from '../context/ChatContext';

const CATEGORIES = [
  { id: 'all', label: 'All Electronics', icon: LayoutGrid },
  { id: 'laptops', label: 'Laptops', icon: Laptop },
  { id: 'smartphones', label: 'Smartphones', icon: Smartphone },
  { id: 'audio', label: 'Audio & Hi-Fi', icon: Headphones },
  { id: 'wearables', label: 'Wearables', icon: Watch },
  { id: 'cameras', label: 'Cameras & Gear', icon: Camera },
  { id: 'workspace', label: 'Workspace', icon: Layers },
  { id: 'charging', label: 'Power & Charging', icon: Zap }
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
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

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category?.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="page">
      <Nav />

      {/* Hero Banner */}
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.heroPill}>
            <Sparkles size={13} color="var(--sage)" />
            <span>AgentCart · Autonomous Electronics Commerce</span>
          </div>

          <h1 style={styles.heroTitle}>
            Next-gen tech, guided by intelligent AI checkout.
          </h1>

          <p style={styles.heroSubtitle}>
            Browse flagship electronics or let our shopping agent find deals, assemble bundles, and complete verified Razorpay transactions with policy safety.
          </p>

          <div style={styles.heroBtns}>
            <button
              className="btn btn-primary"
              onClick={() => openChatWithPrompt('I am looking for a laptop and matching accessories')}
            >
              <Bot size={16} color="#fff" />
              <span>Ask AI Concierge</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Explore Catalog ({products.length})
            </button>
          </div>

          <div style={styles.trustBadges}>
            <div style={styles.trustItem}>
              <ShieldCheck size={16} color="var(--sage)" />
              <span>Policy Guarded</span>
            </div>
            <div style={styles.trustItem}>
              <Truck size={16} color="var(--coral)" />
              <span>Express Delivery</span>
            </div>
            <div style={styles.trustItem}>
              <RotateCcw size={16} color="var(--mustard)" />
              <span>Official Warranty</span>
            </div>
          </div>
        </div>

        <div style={styles.heroMedia}>
          <img
            src="/images/hero_banner.jpg"
            alt="AgentCart Electronics"
            style={styles.heroImage}
          />
          <div style={styles.heroFloatingBadge}>
            <div style={styles.floatingAvatar}>
              <Bot size={18} color="#fff" />
            </div>
            <div>
              <div style={styles.floatingTitle}>AI Concierge Ready</div>
              <div style={styles.floatingDesc}>Personalized recommendations & instant cart</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Category Filter Pills */}
      <div id="catalog-section" style={{ marginTop: '36px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div className="section-title" style={{ margin: 0 }}>Browse by Category</div>
          <span style={{ fontSize: '13px', color: 'var(--slate)' }}>
            Showing {filteredProducts.length} of {products.length} products
          </span>
        </div>

        <div style={styles.cats}>
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  ...styles.catBtn,
                  background: isSelected ? 'var(--coral)' : 'var(--white)',
                  color: isSelected ? '#ffffff' : 'var(--ink)',
                  borderColor: isSelected ? 'var(--coral)' : 'rgba(239, 232, 218, 0.95)',
                  boxShadow: isSelected ? '0 4px 12px rgba(240, 101, 74, 0.25)' : 'var(--shadow-sm)'
                }}
              >
                <Icon size={16} color={isSelected ? '#ffffff' : 'var(--slate)'} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : error ? (
        <div className="empty-state">
          <h3>Error loading products</h3>
          <p>{error}</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">
          <h3>No products in this category</h3>
          <p>Try selecting another category or clear your filter.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredProducts.map(product => (
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
    fontSize: '36px',
    fontWeight: '700',
    lineHeight: 1.18,
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
    gap: '10px',
    marginBottom: '28px',
    flexWrap: 'wrap'
  },
  catBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '12px',
    fontSize: '13.5px',
    fontWeight: '600',
    cursor: 'pointer',
    border: '1px solid',
    transition: 'all 0.15s ease'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '20px'
  }
};
