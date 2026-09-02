import React, { useEffect, useState, useMemo } from 'react';
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
  LayoutGrid,
  Gamepad2,
  Tablet,
  Home as HomeIcon,
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Tag
} from 'lucide-react';
import Nav from '../components/Nav';
import ProductCard from '../components/ProductCard';
import { getProducts } from '../api/client';
import { useChat } from '../context/ChatContext';

const CATEGORIES = [
  { id: 'all', label: 'All Electronics', icon: LayoutGrid },
  { id: 'laptops', label: 'Laptops', icon: Laptop },
  { id: 'smartphones', label: 'Smartphones', icon: Smartphone },
  { id: 'tablets', label: 'Tablets', icon: Tablet },
  { id: 'audio', label: 'Audio & Hi-Fi', icon: Headphones },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { id: 'wearables', label: 'Wearables', icon: Watch },
  { id: 'cameras', label: 'Cameras', icon: Camera },
  { id: 'workspace', label: 'Workspace', icon: Layers },
  { id: 'smarthome', label: 'Smart Home', icon: HomeIcon },
  { id: 'charging', label: 'Power & Charging', icon: Zap }
];

const QUICK_TAGS = [
  { label: '⚡ Instant AI Checkout (≤₹1L)', action: 'instant' },
  { label: 'Apple', query: 'Apple' },
  { label: 'Sony', query: 'Sony' },
  { label: 'Under ₹5,000', price: 'under5000' },
  { label: 'Keyboards & Mice', query: 'Logitech Keychron' },
  { label: 'GaN Chargers & Cables', query: 'Charger Cable' }
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [instantCheckoutOnly, setInstantCheckoutOnly] = useState(false);
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

  // Multi-criteria filter & sort computation
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        // 1. Category Filter
        if (selectedCategory !== 'all' && p.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }

        // 2. Search Query Filter (name, description, category)
        if (searchQuery.trim()) {
          const terms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
          const nameMatch = p.name?.toLowerCase() || '';
          const descMatch = p.description?.toLowerCase() || '';
          const catMatch = p.category?.toLowerCase() || '';
          const combined = `${nameMatch} ${descMatch} ${catMatch}`;
          const matchesAll = terms.every(t => combined.includes(t));
          if (!matchesAll) return false;
        }

        // 3. Instant AI Checkout Filter (Policy limit ₹1,00,000)
        if (instantCheckoutOnly && p.price > 100000) {
          return false;
        }

        // 4. Price Range Filter
        if (priceRange === 'under1000' && p.price >= 1000) return false;
        if (priceRange === 'under5000' && p.price >= 5000) return false;
        if (priceRange === '1000to100000' && (p.price < 1000 || p.price > 100000)) return false;
        if (priceRange === 'under100000' && p.price > 100000) return false;
        if (priceRange === 'above100000' && p.price <= 100000) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
        return 0; // Default order
      });
  }, [products, selectedCategory, searchQuery, priceRange, sortBy, instantCheckoutOnly]);

  const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== 'all' || priceRange !== 'all' || instantCheckoutOnly || sortBy !== 'featured';

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setPriceRange('all');
    setSortBy('featured');
    setInstantCheckoutOnly(false);
  };

  const handleQuickTagClick = (tag) => {
    if (tag.action === 'instant') {
      setInstantCheckoutOnly(prev => !prev);
    } else if (tag.query) {
      setSearchQuery(tag.query);
    } else if (tag.price) {
      setPriceRange(tag.price);
    }
  };

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
              onClick={() => openChatWithPrompt('I am looking for electronics recommendations within my budget')}
            >
              <Bot size={16} color="#fff" />
              <span>Ask AI Concierge</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                document.getElementById('catalog-search-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Explore Products ({products.length})
            </button>
          </div>

          <div style={styles.trustBadges}>
            <div style={styles.trustItem}>
              <ShieldCheck size={16} color="var(--sage)" />
              <span>Policy Guarded (₹1L Cap)</span>
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

      {/* ── Product Search & Filter Section ───────────────────────────────────── */}
      <div id="catalog-search-section" style={styles.searchSection}>
        {/* Main Search Input */}
        <div style={styles.searchBarRow}>
          <div style={styles.searchInputWrapper}>
            <Search size={19} color="var(--slate)" style={styles.searchIcon} />
            <input
              type="text"
              style={styles.searchInput}
              placeholder="Search products by model, brand, accessories, keywords (e.g. 'iPhone', 'Mechanical Keyboard', 'GaN Charger')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                style={styles.clearSearchBtn}
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Quick AI Search Assistant Button */}
          <button
            style={styles.aiSearchBtn}
            onClick={() => openChatWithPrompt(searchQuery.trim() ? `Help me find and compare products related to "${searchQuery}"` : "Help me find the best products in the store")}
            title="Ask AI Concierge to find specific tech"
          >
            <Bot size={16} color="#fff" />
            <span>AI Search Assistant</span>
          </button>
        </div>

        {/* Quick Search Trending Tags */}
        <div style={styles.trendingRow}>
          <div style={styles.trendingLabel}>
            <TrendingUp size={13} color="var(--coral)" />
            <span>Popular Searches:</span>
          </div>
          <div style={styles.trendingTags}>
            {QUICK_TAGS.map((tag, idx) => {
              const isActive = (tag.action === 'instant' && instantCheckoutOnly) || (tag.query && searchQuery === tag.query) || (tag.price && priceRange === tag.price);
              return (
                <button
                  key={idx}
                  style={{
                    ...styles.trendingTag,
                    background: isActive ? 'var(--coral)' : 'var(--cream)',
                    color: isActive ? '#ffffff' : 'var(--ink)',
                    borderColor: isActive ? 'var(--coral)' : 'var(--sand)'
                  }}
                  onClick={() => handleQuickTagClick(tag)}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Controls Toolbar */}
        <div style={styles.toolbar}>
          <div style={styles.toolbarLeft}>
            {/* Price Filter Dropdown */}
            <div style={styles.filterGroup}>
              <SlidersHorizontal size={14} color="var(--slate)" />
              <label style={styles.filterLabel}>Price Range:</label>
              <select
                style={styles.select}
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
              >
                <option value="all">All Prices</option>
                <option value="under1000">Under ₹1,000 (Budget)</option>
                <option value="under5000">Under ₹5,000</option>
                <option value="1000to100000">₹1,000 – ₹1,00,000 (AI Checkout Eligible)</option>
                <option value="above100000">Above ₹1,00,000 (Flagships)</option>
              </select>
            </div>

            {/* Instant AI Checkout Policy Toggle */}
            <button
              type="button"
              style={{
                ...styles.instantToggle,
                background: instantCheckoutOnly ? 'var(--sage-bg)' : 'var(--white)',
                borderColor: instantCheckoutOnly ? 'var(--sage)' : 'var(--border)',
                color: instantCheckoutOnly ? '#2c5936' : 'var(--ink)'
              }}
              onClick={() => setInstantCheckoutOnly(!instantCheckoutOnly)}
              title="Filter items under ₹1,00,000 policy gate limit"
            >
              <ShieldCheck size={15} color={instantCheckoutOnly ? 'var(--sage)' : 'var(--slate)'} />
              <span>Instant AI Checkout (≤₹1L)</span>
              {instantCheckoutOnly && <CheckCircle2 size={13} color="var(--sage)" />}
            </button>
          </div>

          <div style={styles.toolbarRight}>
            {/* Sort Dropdown */}
            <div style={styles.filterGroup}>
              <ArrowUpDown size={14} color="var(--slate)" />
              <label style={styles.filterLabel}>Sort by:</label>
              <select
                style={styles.select}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="featured">Featured / Default</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>

            {/* Clear All Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                style={styles.resetFiltersBtn}
                onClick={resetAllFilters}
              >
                <RotateCcw size={13} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Category Filter Pills */}
      <div style={{ marginTop: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div className="section-title" style={{ margin: 0 }}>Browse by Category</div>
          <span style={{ fontSize: '13px', color: 'var(--slate)', fontWeight: '500' }}>
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

      {/* Product Grid / Loading / Empty State */}
      {loading ? (
        <div className="spinner" />
      ) : error ? (
        <div className="empty-state">
          <h3>Error loading products</h3>
          <p>{error}</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div style={styles.emptySearchCard}>
          <div style={styles.emptyIconCircle}>
            <Search size={32} color="var(--slate)" />
          </div>
          <h3 style={styles.emptyTitle}>No matching products found</h3>
          <p style={styles.emptyDesc}>
            {searchQuery
              ? `We couldn't find any products matching "${searchQuery}" with the current filters.`
              : 'No products match the selected filters.'}
          </p>

          <div style={styles.emptyActions}>
            {hasActiveFilters && (
              <button className="btn btn-secondary" onClick={resetAllFilters}>
                <RotateCcw size={15} />
                <span>Clear All Filters</span>
              </button>
            )}

            <button
              className="btn btn-primary"
              onClick={() => openChatWithPrompt(searchQuery ? `Can you help me find products similar to "${searchQuery}"?` : "Show me popular tech products")}
            >
              <Bot size={16} color="#fff" />
              <span>Ask AI Concierge to Find Items</span>
            </button>
          </div>
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
  searchSection: {
    background: 'var(--white)',
    borderRadius: '24px',
    padding: '22px 26px',
    marginBottom: '16px',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  searchBarRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  searchInputWrapper: {
    position: 'relative',
    flex: 1,
    minWidth: '280px',
    display: 'flex',
    alignItems: 'center'
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    pointerEvents: 'none'
  },
  searchInput: {
    width: '100%',
    padding: '13px 42px 13px 46px',
    borderRadius: '16px',
    border: '1.5px solid var(--border)',
    background: 'var(--cream)',
    fontSize: '14px',
    color: 'var(--ink)',
    outline: 'none',
    transition: 'border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease'
  },
  clearSearchBtn: {
    position: 'absolute',
    right: '12px',
    background: 'rgba(0, 0, 0, 0.08)',
    border: 'none',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--slate)',
    transition: 'background 0.15s ease'
  },
  aiSearchBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, var(--coral) 0%, var(--coral-dark) 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '14px',
    padding: '13px 20px',
    fontSize: '13.5px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(240, 101, 74, 0.3)',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap'
  },
  trendingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    fontSize: '12.5px'
  },
  trendingLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontWeight: '700',
    color: 'var(--ink)',
    flexShrink: 0
  },
  trendingTags: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap'
  },
  trendingTag: {
    padding: '5px 12px',
    borderRadius: '20px',
    border: '1px solid',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '14px',
    borderTop: '1px solid var(--border)',
    flexWrap: 'wrap',
    gap: '14px'
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap'
  },
  toolbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap'
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px'
  },
  filterLabel: {
    fontWeight: '600',
    color: 'var(--slate)',
    fontSize: '12.5px'
  },
  select: {
    padding: '7px 12px',
    borderRadius: '10px',
    border: '1.5px solid var(--border)',
    background: 'var(--cream)',
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--ink)',
    outline: 'none',
    cursor: 'pointer'
  },
  instantToggle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 13px',
    borderRadius: '10px',
    border: '1.5px solid',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  resetFiltersBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    background: 'none',
    border: 'none',
    color: 'var(--coral)',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer',
    padding: '6px 8px',
    borderRadius: '8px',
    transition: 'background 0.15s ease'
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
  },
  emptySearchCard: {
    background: 'var(--white)',
    borderRadius: '24px',
    padding: '48px 32px',
    textAlign: 'center',
    border: '1.5px dashed var(--sand)',
    margin: '20px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px'
  },
  emptyIconCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'var(--cream)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '4px'
  },
  emptyTitle: {
    fontFamily: 'var(--font-brand)',
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--ink)',
    margin: 0
  },
  emptyDesc: {
    fontSize: '14px',
    color: 'var(--slate)',
    maxWidth: '480px',
    margin: 0,
    lineHeight: 1.5
  },
  emptyActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '12px',
    flexWrap: 'wrap',
    justifyContent: 'center'
  }
};
