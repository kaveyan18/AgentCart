import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'agentcart_cart';

function getInitialCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load cart from localStorage:', e);
    return [];
  }
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(getInitialCart);

  // Synchronize cart with localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to persist cart to localStorage:', e);
    }
  }, [cartItems]);

  /**
   * Add a product to the cart.
   * If the item already exists (matched by id / _id or name), increment its quantity.
   */
  const addToCart = (product, qty = 1) => {
    if (!product) return;
    const prodId = product._id || product.id;
    const addQty = Math.max(1, Number(qty) || 1);

    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => (item.id || item._id) === prodId || item.name === product.name);

      if (existingIndex > -1) {
        // Prevent duplicates — increase quantity instead
        const updated = [...prev];
        const currentQty = updated[existingIndex].qty || 1;
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: currentQty + addQty
        };
        return updated;
      } else {
        // New item
        const newItem = {
          id: prodId,
          _id: prodId,
          name: product.name,
          price: Number(product.price) || 0,
          category: product.category || 'general',
          description: product.description || '',
          qty: addQty
        };
        return [...prev, newItem];
      }
    });
  };

  /**
   * Add multiple items at once (useful for AI bundled order proposals)
   */
  const addBundleToCart = (items = []) => {
    if (!Array.isArray(items) || items.length === 0) return;
    items.forEach(it => addToCart(it, it.qty || 1));
  };

  /**
   * Remove a product from the cart completely
   */
  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => (item.id || item._id) !== productId && item.name !== productId));
  };

  /**
   * Update the quantity of a specific item in the cart.
   * If newQty <= 0, the item is removed.
   */
  const updateQuantity = (productId, newQty) => {
    const qty = Number(newQty);
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems(prev =>
      prev.map(item => {
        if ((item.id || item._id) === productId || item.name === productId) {
          return { ...item, qty };
        }
        return item;
      })
    );
  };

  /**
   * Clear all items in the cart (called on successful payment)
   */
  const clearCart = () => {
    setCartItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear cart storage:', e);
    }
  };

  // Derived values
  const cartCount = cartItems.reduce((acc, item) => acc + (item.qty || 1), 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * (item.qty || 1)), 0);

  const value = {
    cartItems,
    cartCount,
    cartTotal,
    addToCart,
    addBundleToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
