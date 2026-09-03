import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ArrowUpRight, Sparkles, ShoppingCart, Check } from 'lucide-react';
import { formatPrice, getCategoryTheme, getProductImage } from '../utils/helpers';
import { useChat } from '../context/ChatContext';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { openChatWithPrompt } = useChat();
  const { addToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const theme = getCategoryTheme(product.category);
  const imageUrl = getProductImage(product._id);

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  return (
    <div
      style={styles.card}
      onClick={() => navigate(`/product/${product._id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/product/${product._id}`)}
    >
      <div style={styles.imageWrap}>
        <img
          src={imageUrl}
          alt={product.name}
          style={styles.image}
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/hero_banner.jpg';
          }}
        />
        <div style={{ ...styles.categoryBadge, background: theme.bg, color: 'var(--ink)' }}>
          {product.category}
        </div>
      </div>

      <div style={styles.details}>
        <div style={styles.ratingRow}>
          <div style={styles.stars}>
            <Star size={12} fill="var(--mustard)" color="var(--mustard)" />
            <Star size={12} fill="var(--mustard)" color="var(--mustard)" />
            <Star size={12} fill="var(--mustard)" color="var(--mustard)" />
            <Star size={12} fill="var(--mustard)" color="var(--mustard)" />
            <Star size={12} fill="var(--mustard)" color="var(--mustard)" />
          </div>
          <span style={styles.ratingNum}>4.9</span>
        </div>

        <h3 style={styles.name}>{product.name}</h3>

        <div style={styles.bottomRow}>
          <div>
            <div style={styles.priceLabel}>Price</div>
            <div style={styles.price}>{formatPrice(product.price)}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              style={{
                ...styles.cartButton,
                background: justAdded ? '#16a34a' : 'var(--cream)',
                color: justAdded ? '#ffffff' : 'var(--ink)'
              }}
              title={justAdded ? "Added to Cart!" : "Add to Cart"}
              onClick={handleQuickAdd}
            >
              {justAdded ? <Check size={14} /> : <ShoppingCart size={14} />}
              <span>{justAdded ? "Added" : "+ Cart"}</span>
            </button>

            <button
              style={styles.aiButton}
              title="Ask AI about this"
              onClick={(e) => {
                e.stopPropagation();
                openChatWithPrompt(`Tell me more about the ${product.name} and add it to my cart`);
              }}
            >
              <Sparkles size={14} color="#fff" />
              <span>AI</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: 'var(--white)',
    borderRadius: '20px',
    padding: '12px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid rgba(239, 232, 218, 0.9)',
    boxShadow: 'var(--shadow-sm)',
    position: 'relative'
  },
  imageWrap: {
    height: '180px',
    borderRadius: '14px',
    overflow: 'hidden',
    position: 'relative',
    background: 'var(--cream)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease'
  },
  categoryBadge: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    fontSize: '10.5px',
    fontWeight: '700',
    padding: '4px 8px',
    borderRadius: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    backdropFilter: 'blur(4px)'
  },
  details: {
    padding: '12px 4px 4px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '6px'
  },
  stars: {
    display: 'flex',
    gap: '2px'
  },
  ratingNum: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--slate)'
  },
  name: {
    fontSize: '14.5px',
    fontWeight: '600',
    lineHeight: '1.3',
    color: 'var(--ink)',
    marginBottom: '10px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    minHeight: '38px'
  },
  bottomRow: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: '8px',
    borderTop: '1px solid var(--border)'
  },
  priceLabel: {
    fontSize: '10.5px',
    color: 'var(--slate)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontWeight: '600'
  },
  price: {
    fontFamily: 'var(--font-brand)',
    fontSize: '17px',
    fontWeight: '700',
    color: 'var(--coral-dark)'
  },
  cartButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    border: '1px solid var(--sand)',
    borderRadius: '10px',
    padding: '7px 10px',
    fontSize: '11.5px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  aiButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    background: 'var(--coral)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '7px 10px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.15s ease, transform 0.15s ease'
  }
};
