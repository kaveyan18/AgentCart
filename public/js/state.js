// state.js — Single source of truth for all app state
// Imported by every module that needs to read or write shared state.

export const state = {
  /** Groq conversation history — passed back to /api/chat each turn */
  chatHistory: [],

  /** Products fetched from /api/products */
  products: [],

  /** Currently viewed product */
  currentProduct: null,

  /** Pending order data after propose_order; cleared after payment */
  pendingOrder: null,   // { items, total }
};
