import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import {
  getCartApi,
  addToCartApi,
  addBundleToCartApi,
  updateCartItemApi,
  removeCartItemApi,
  clearCartApi,
  mergeCartApi
} from '../api/client';

const CartContext = createContext(null);
const GUEST_STORAGE_KEY = 'agentcart_guest_cart';

function getInitialGuestCart() {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY) || localStorage.getItem('agentcart_cart');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load guest cart from localStorage:', e);
    return [];
  }
}

export function CartProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [cartItems, setCartItems] = useState(getInitialGuestCart);
  const [isLoading, setIsLoading] = useState(false);
  const isMergingRef = useRef(false);

  // Clean up legacy storage key
  useEffect(() => {
    try {
      localStorage.removeItem('agentcart_cart');
    } catch {}
  }, []);

  // Fetch or merge server cart upon authentication
  useEffect(() => {
    let isMounted = true;

    async function syncAuthCart() {
      if (!isAuthenticated) {
        // User logged out: clear in-memory cart and isolate from previous user's data
        const guestItems = getInitialGuestCart();
        if (isMounted) setCartItems(guestItems);
        return;
      }

      setIsLoading(true);
      try {
        // Check for pre-login guest items to merge into the user's server cart
        let guestItems = [];
        try {
          const raw = localStorage.getItem(GUEST_STORAGE_KEY);
          if (raw) guestItems = JSON.parse(raw);
        } catch {}

        if (Array.isArray(guestItems) && guestItems.length > 0 && !isMergingRef.current) {
          isMergingRef.current = true;
          const merged = await mergeCartApi(guestItems);
          try {
            localStorage.removeItem(GUEST_STORAGE_KEY);
          } catch {}
          if (isMounted && merged?.items) {
            setCartItems(merged.items);
          }
          isMergingRef.current = false;
        } else {
          // Fetch authoritative cart from backend for this user
          const serverCart = await getCartApi();
          if (isMounted && serverCart?.items) {
            setCartItems(serverCart.items);
          }
        }
      } catch (err) {
        console.error('[CART SYNC ERROR]', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    syncAuthCart();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.email]);

  // Persist guest cart to localStorage ONLY when unauthenticated
  useEffect(() => {
    if (!isAuthenticated) {
      try {
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(cartItems));
      } catch (e) {
        console.error('Failed to persist guest cart:', e);
      }
    }
  }, [cartItems, isAuthenticated]);

  /**
   * Add a product to the cart with instant optimistic UI update + server sync
   */
  const addToCart = async (product, qty = 1) => {
    if (!product) return;
    const prodId = product.productId || product._id || product.id;
    const addQty = Math.max(1, Number(qty) || 1);
    const unitPrice = Number(product.price) || 0;

    // 1. Optimistic local state update
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => {
        const itemId = item.productId || item.id || item._id;
        return itemId === prodId || item.name === product.name;
      });

      if (existingIndex > -1) {
        const updated = [...prev];
        const currentQty = updated[existingIndex].qty || 1;
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: currentQty + addQty,
          subtotal: (currentQty + addQty) * (updated[existingIndex].price || unitPrice)
        };
        return updated;
      } else {
        const newItem = {
          productId: prodId,
          id: prodId,
          _id: prodId,
          name: product.name,
          price: unitPrice,
          category: product.category || 'general',
          qty: addQty,
          subtotal: unitPrice * addQty
        };
        return [...prev, newItem];
      }
    });

    // 2. Server persistence if authenticated
    if (isAuthenticated) {
      try {
        const res = await addToCartApi(prodId, addQty, product.name, unitPrice);
        if (res?.items) {
          setCartItems(res.items);
        }
      } catch (err) {
        console.error('Failed to add to server cart:', err);
      }
    }
  };

  /**
   * Add a bundle of items (e.g. from AI proposal)
   */
  const addBundleToCart = async (items = []) => {
    if (!Array.isArray(items) || items.length === 0) return;

    // Optimistically update all
    items.forEach(it => {
      addToCart(it, it.qty || 1);
    });

    if (isAuthenticated) {
      try {
        const res = await addBundleToCartApi(items);
        if (res?.items) {
          setCartItems(res.items);
        }
      } catch (err) {
        console.error('Failed to add bundle to server cart:', err);
      }
    }
  };

  /**
   * Update quantity of a product with optimistic UI + server sync
   */
  const updateQuantity = async (productId, newQty) => {
    const qty = Number(newQty);

    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }

    // Optimistic update
    setCartItems(prev =>
      prev.map(item => {
        const itemId = item.productId || item.id || item._id;
        if (itemId === productId || item.name === productId) {
          return {
            ...item,
            qty,
            subtotal: qty * item.price
          };
        }
        return item;
      })
    );

    if (isAuthenticated) {
      try {
        const res = await updateCartItemApi(productId, qty);
        if (res?.items) {
          setCartItems(res.items);
        }
      } catch (err) {
        console.error('Failed to update server cart item:', err);
      }
    }
  };

  /**
   * Remove a product from cart
   */
  const removeFromCart = async (productId) => {
    // Optimistic removal
    setCartItems(prev =>
      prev.filter(item => {
        const itemId = item.productId || item.id || item._id;
        return itemId !== productId && item.name !== productId;
      })
    );

    if (isAuthenticated) {
      try {
        const res = await removeCartItemApi(productId);
        if (res?.items) {
          setCartItems(res.items);
        }
      } catch (err) {
        console.error('Failed to remove item from server cart:', err);
      }
    }
  };

  /**
   * Clear entire cart (e.g. after successful checkout)
   */
  const clearCart = async () => {
    setCartItems([]);
    if (!isAuthenticated) {
      try {
        localStorage.removeItem(GUEST_STORAGE_KEY);
      } catch {}
    } else {
      try {
        await clearCartApi();
      } catch (err) {
        console.error('Failed to clear server cart:', err);
      }
    }
  };

  // Derived metrics
  const cartCount = cartItems.reduce((acc, item) => acc + (item.qty || 1), 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * (item.qty || 1)), 0);

  const value = {
    cartItems,
    cartCount,
    cartTotal,
    isLoading,
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
