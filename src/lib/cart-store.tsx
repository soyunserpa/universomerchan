// ============================================================
// UNIVERSO MERCHAN — Cart Store
// ============================================================
// Client-side cart state management.
//
// Strategy:
//   - Anonymous users: localStorage (migrated to DB on login)
//   - Logged-in users: DB-backed via API calls
//   - Both: React context for instant UI updates
//
// The cart survives page refreshes, browser closes, and 
// can be restored from a quote link (PRE-2026-XXXX).
// ============================================================

"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { CartItem } from "@/lib/configurator-engine";

// ============================================================
// TYPES
// ============================================================

export interface CartState {
  items: CartItem[];
  isLoading: boolean;
  isOpen: boolean;          // Mini-cart sidebar open?
  lastAddedItem: CartItem | null;  // For "just added" notification
  couponCode: string | null;
  error: string | null;
}

type CartAction =
  | { type: "ADD_ITEM"; item: CartItem }
  | { type: "REMOVE_ITEM"; index: number }
  | { type: "UPDATE_QUANTITY"; index: number; quantity: number }
  | { type: "CLEAR_CART" }
  | { type: "RESTORE_CART"; items: CartItem[] }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "TOGGLE_CART"; open?: boolean }
  | { type: "DISMISS_NOTIFICATION" }
  | { type: "SET_COUPON"; code: string | null }
  | { type: "SET_ERROR"; error: string | null };

interface CartContextValue {
  state: CartState;
  addItem: (item: CartItem) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  restoreFromQuote: (quoteNumber: string) => Promise<void>;
  restoreFromOrder: (orderNumber: string) => Promise<void>;
  toggleCart: (open?: boolean) => void;
  dismissNotification: () => void;

  // Computed values
  itemCount: number;
  subtotal: number;
  totalItems: number;   // Sum of all quantities
}

// ============================================================
// REDUCER
// ============================================================

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      // Check if same product+variant+customization already in cart
      const existingIndex = state.items.findIndex(
        (i) =>
          i.variantSku === action.item.variantSku &&
          i.orderType === action.item.orderType &&
          JSON.stringify(i.customization) === JSON.stringify(action.item.customization)
      );

      let newItems: CartItem[];
      if (existingIndex >= 0) {
        // Merge quantities and recalculate
        newItems = state.items.map((item, i) => {
          if (i !== existingIndex) return item;
          const newQty = item.quantity + action.item.quantity;
          const newUnitPrice = action.item.unitPriceTotal; // Use latest price
          return {
            ...item,
            quantity: newQty,
            totalPrice: Math.round(newUnitPrice * newQty * 100) / 100,
          };
        });
      } else {
        newItems = [...state.items, action.item];
      }

      return {
        ...state,
        items: newItems,
        lastAddedItem: action.item,
        isOpen: true,
        error: null,
      };
    }

    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((_, i) => i !== action.index),
        error: null,
      };

    case "UPDATE_QUANTITY": {
      if (action.quantity < 1) {
        return {
          ...state,
          items: state.items.filter((_, i) => i !== action.index),
        };
      }
      return {
        ...state,
        items: state.items.map((item, i) => {
          if (i !== action.index) return item;
          return {
            ...item,
            quantity: action.quantity,
            totalPrice: Math.round(item.unitPriceTotal * action.quantity * 100) / 100,
          };
        }),
      };
    }

    case "CLEAR_CART":
      return { ...state, items: [], lastAddedItem: null, error: null };

    case "RESTORE_CART":
      return { ...state, items: action.items, isLoading: false, error: null };

    case "SET_LOADING":
      return { ...state, isLoading: action.loading };

    case "TOGGLE_CART":
      return {
        ...state,
        isOpen: action.open !== undefined ? action.open : !state.isOpen,
      };

    case "DISMISS_NOTIFICATION":
      return { ...state, lastAddedItem: null };

    case "SET_COUPON":
      return { ...state, couponCode: action.code };

    case "SET_ERROR":
      return { ...state, error: action.error };

    default:
      return state;
  }
}

// ============================================================
// INITIAL STATE
// ============================================================

const initialState: CartState = {
  items: [],
  isLoading: true,
  isOpen: false,
  lastAddedItem: null,
  couponCode: null,
  error: null,
};

// ============================================================
// CONTEXT
// ============================================================

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

// ============================================================
// PROVIDER
// ============================================================

const STORAGE_KEY = "universo_merchan_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          dispatch({ type: "RESTORE_CART", items: parsed });
        }
      }
    } catch {
      // Ignore parse errors
    }
    dispatch({ type: "SET_LOADING", loading: false });
  }, []);

  // Persist to localStorage on every change
  useEffect(() => {
    if (!state.isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
      } catch {
        // Storage full or disabled
      }
    }
  }, [state.items, state.isLoading]);

  // Auto-dismiss notification after 4s
  useEffect(() => {
    if (state.lastAddedItem) {
      const timer = setTimeout(() => {
        dispatch({ type: "DISMISS_NOTIFICATION" });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [state.lastAddedItem]);

  // Auto-close mini-cart after 5s
  useEffect(() => {
    if (state.isOpen && state.lastAddedItem) {
      const timer = setTimeout(() => {
        dispatch({ type: "TOGGLE_CART", open: false });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.isOpen, state.lastAddedItem]);

  // ── Actions ──────────────────────────────────────────────

  const addItem = useCallback((item: CartItem) => {
    dispatch({ type: "ADD_ITEM", item });
  }, []);

  const removeItem = useCallback((index: number) => {
    dispatch({ type: "REMOVE_ITEM", index });
  }, []);

  const updateQuantity = useCallback((index: number, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", index, quantity });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
  }, []);

  const restoreFromQuote = useCallback(async (quoteNumber: string) => {
    dispatch({ type: "SET_LOADING", loading: true });
    try {
      const response = await fetch(`/api/quotes/${quoteNumber}/restore`);
      if (!response.ok) throw new Error("Presupuesto no encontrado o expirado");
      const data = await response.json();
      dispatch({ type: "RESTORE_CART", items: data.items });
    } catch (error: any) {
      dispatch({ type: "SET_ERROR", error: error.message });
      dispatch({ type: "SET_LOADING", loading: false });
    }
  }, []);

  const restoreFromOrder = useCallback(async (orderNumber: string) => {
    dispatch({ type: "SET_LOADING", loading: true });
    try {
      const response = await fetch(`/api/account/orders/${orderNumber}/restore-cart`);
      if (!response.ok) throw new Error("Pedido no encontrado o inválido");
      const data = await response.json();
      dispatch({ type: "RESTORE_CART", items: data.items });
    } catch (error: any) {
      dispatch({ type: "SET_ERROR", error: error.message });
      dispatch({ type: "SET_LOADING", loading: false });
    }
  }, []);

  const toggleCart = useCallback((open?: boolean) => {
    dispatch({ type: "TOGGLE_CART", open });
  }, []);

  const dismissNotification = useCallback(() => {
    dispatch({ type: "DISMISS_NOTIFICATION" });
  }, []);

  // ── Computed ─────────────────────────────────────────────

  const itemCount = state.items.length;
  const subtotal = state.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        restoreFromQuote,
        restoreFromOrder,
        toggleCart,
        dismissNotification,
        itemCount,
        subtotal,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
