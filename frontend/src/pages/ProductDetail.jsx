import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  CreditCard,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import Nav from '../components/Nav';
import { getProducts } from '../api/client';
import { formatPrice, getCategoryTheme, getProductImage } from '../utils/helpers';
import { useChat } from '../context/ChatContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { openChatWithPrompt, processCheckout } = useChat();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const catalog = await getProducts();
        const found = catalog.find(p => String(p._id) === String(id));
        setProduct(found || null);

        if (found && found.relatedTo) {
          const related = catalog.filter(p => found.relatedTo.includes(p._id));
          setRelatedProducts(related);
        } else {
          setRelatedProducts([]);
        }
      } catch (err) {
        console.error('Failed to load product detail:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="page">
        <Nav />
        <div className="spinner" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page">
        <Nav />
        <div className="empty-state">
          <h3>Product not found</h3>
          <p>The product you are looking for does not exist or has been removed.</p>
          <button
            className="btn btn-primary"
            style={{ marginTop: '16px' }}
            onClick={() => navigate('/')}
          >
            Back to Catalog
          </button>
        </div>
      </div>
    );
  }

  const theme = getCategoryTheme(product.category);
  const imageUrl = getProductImage(product._id);

  return (
    <div className="page">
      <Nav />

      <button
        style={styles.backLink}
        onClick={() => navigate('/')}
      >
        <ArrowLeft size={16} /> Back to storefront
      </button>

      <div style={styles.pdGrid}>
        {/* Left: Studio Product Photography */}
        <div style={styles.mediaContainer}>
          <div style={styles.pdImageWrap}>
            <img
              src={imageUrl}
              alt={product.name}
              style={styles.pdImage}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/hero_banner.jpg';
              }}
            />
            <div style={{ ...styles.categoryBadge, background: theme.bg, color: 'var(--ink)' }}>
              {product.category}
            </div>
          </div>
        </div>

        {/* Right: Info & Actions */}
        <div style={styles.infoCol}>
          <div style={styles.ratingRow}>
            <div style={styles.stars}>
              <Star size={14} fill="var(--mustard)" color="var(--mustard)" />
              <Star size={14} fill="var(--mustard)" color="var(--mustard)" />
              <Star size={14} fill="var(--mustard)" color="var(--mustard)" />
              <Star size={14} fill="var(--mustard)" color="var(--mustard)" />
              <Star size={14} fill="var(--mustard)" color="var(--mustard)" />
            </div>
            <span style={styles.ratingText}>4.9 out of 5 &nbsp;·&nbsp; 128 verified reviews</span>
          </div>

          <h1 style={styles.pdName}>{product.name}</h1>
          <div style={styles.pdPrice}>{formatPrice(product.price)}</div>

          <div style={styles.pdDesc}>
            {product.description ||
              'High quality precision-engineered device accessory built with premium materials for maximum durability and seamless compatibility.'}
          </div>

          {/* Highlights & Guarantees */}
          <div style={styles.guaranteeList}>
            <div style={styles.guaranteeItem}>
              <CheckCircle2 size={16} color="var(--sage)" />
              <span>In stock & ready to ship today</span>
            </div>
            <div style={styles.guaranteeItem}>
              <ShieldCheck size={16} color="var(--sage)" />
              <span>Policy gate pre-verified (Max limit ₹5,000)</span>
            </div>
            <div style={styles.guaranteeItem}>
              <CreditCard size={16} color="var(--coral)" />
              <span>Direct Razorpay signature-verified checkout</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={styles.pdActions}>
            <button
              className="btn btn-primary"
              style={styles.mainActionBtn}
              onClick={() => openChatWithPrompt(`I want to buy the ${product.name}, can you suggest matching add-ons?`)}
            >
              <Sparkles size={16} color="#fff" />
              <span>Ask AI to Add & Bundle</span>
            </button>
            <button
              className="btn btn-secondary"
              style={styles.secondaryActionBtn}
              onClick={() => processCheckout([{ name: product.name, price: product.price, qty: 1 }], navigate)}
            >
              Instant Checkout
            </button>
          </div>

          {/* Related Products Strip */}
          {relatedProducts.length > 0 && (
            <div style={styles.relatedSection}>
              <div style={styles.relatedTitle}>Frequently bought together</div>
              <div style={styles.relatedRow}>
                {relatedProducts.map(rel => {
                  const relImg = getProductImage(rel._id);
                  return (
                    <div
                      key={rel._id}
                      style={styles.relatedCard}
                      onClick={() => navigate(`/product/${rel._id}`)}
                    >
                      <div style={styles.relatedThumbWrap}>
                        <img
                          src={relImg}
                          alt={rel.name}
                          style={styles.relatedThumb}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/hero_banner.jpg';
                          }}
                        />
                      </div>
                      <div style={styles.relatedName}>{rel.name}</div>
                      <div style={styles.relatedPrice}>{formatPrice(rel.price)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    color: 'var(--slate)',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '18px',
    padding: '4px 0'
  },
  pdGrid: {
    display: 'grid',
    gridTemplateColumns: '480px 1fr',
    gap: '40px',
    background: 'var(--white)',
    borderRadius: '24px',
    padding: '36px',
    border: '1px solid rgba(239, 232, 218, 0.9)',
    boxShadow: 'var(--shadow-sm)'
  },
  mediaContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  pdImageWrap: {
    borderRadius: '20px',
    height: '420px',
    position: 'relative',
    overflow: 'hidden',
    background: 'var(--cream)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--shadow-md)'
  },
  pdImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  categoryBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    fontSize: '11px',
    fontWeight: '700',
    padding: '5px 10px',
    borderRadius: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    backdropFilter: 'blur(6px)'
  },
  infoCol: {
    display: 'flex',
    flexDirection: 'column'
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px'
  },
  stars: {
    display: 'flex',
    gap: '2px'
  },
  ratingText: {
    fontSize: '12.5px',
    color: 'var(--slate)',
    fontWeight: '500'
  },
  pdName: {
    fontFamily: 'var(--font-brand)',
    fontSize: '30px',
    fontWeight: '700',
    marginBottom: '10px',
    color: 'var(--ink)',
    lineHeight: '1.2'
  },
  pdPrice: {
    fontFamily: 'var(--font-brand)',
    fontSize: '28px',
    fontWeight: '700',
    color: 'var(--coral-dark)',
    marginBottom: '16px'
  },
  pdDesc: {
    fontSize: '14.5px',
    lineHeight: '1.7',
    color: 'var(--ink)',
    marginBottom: '20px'
  },
  guaranteeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '14px 16px',
    background: 'var(--sage-bg)',
    borderRadius: '14px',
    marginBottom: '24px'
  },
  guaranteeItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12.5px',
    fontWeight: '600',
    color: 'var(--ink)'
  },
  pdActions: {
    display: 'flex',
    gap: '14px',
    marginBottom: '28px'
  },
  mainActionBtn: {
    flex: 1.2
  },
  secondaryActionBtn: {
    flex: 1
  },
  relatedSection: {
    marginTop: 'auto',
    paddingTop: '20px',
    borderTop: '1px solid var(--border)'
  },
  relatedTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--slate)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '12px'
  },
  relatedRow: {
    display: 'flex',
    gap: '14px',
    flexWrap: 'wrap'
  },
  relatedCard: {
    background: 'var(--cream)',
    borderRadius: '14px',
    padding: '10px',
    width: '140px',
    cursor: 'pointer',
    transition: 'transform 0.15s ease',
    border: '1px solid rgba(239, 232, 218, 0.8)'
  },
  relatedThumbWrap: {
    height: '70px',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '8px',
    background: 'var(--white)'
  },
  relatedThumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  relatedName: {
    fontSize: '11.5px',
    fontWeight: '600',
    marginBottom: '2px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: 'var(--ink)'
  },
  relatedPrice: {
    fontSize: '11px',
    color: 'var(--slate)',
    fontWeight: '600'
  }
};
