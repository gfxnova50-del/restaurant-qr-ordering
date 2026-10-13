'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { MenuItem, PaymentMethod, Restaurant } from '@/types/database';

export interface CartItem {
  id: string; // menu item id
  name: string;
  price: number;
  is_veg: boolean;
  image_url: string | null;
  quantity: number;
  notes?: string;
}

interface CartContextType {
  restaurantSlug: string;
  tableNumber: string;
  setTableNumber: (table: string) => void;
  items: CartItem[];
  addItem: (item: MenuItem | CartItem, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  setItemQuantity: (id: string, quantity: number) => void;
  updateItemNotes: (id: string, notes: string) => void;
  getItemQuantity: (id: string) => number;
  clearCart: () => void;
  totalCount: number;
  subtotal: number;
  customerName: string;
  setCustomerName: (name: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  orderNotes: string;
  setOrderNotes: (notes: string) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  isLoaded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({
  children,
  slug,
  initialTable = '1',
}: {
  children: React.ReactNode;
  slug: string;
  initialTable?: string;
}) {
  const [tableNumber, setTableNumber] = useState<string>(initialTable);
  const [items, setItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('counter');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Storage key per restaurant so tables or other restaurants don't clash
  const storageKey = `qrmenu_cart_${slug}`;

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.items)) setItems(parsed.items);
        if (parsed.customerName) setCustomerName(parsed.customerName);
        if (parsed.customerPhone) setCustomerPhone(parsed.customerPhone);
        if (parsed.orderNotes) setOrderNotes(parsed.orderNotes);
        if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
        if (parsed.tableNumber && !initialTable) setTableNumber(parsed.tableNumber);
      }
    } catch (e) {
      console.warn('Failed to load cart from localStorage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey, initialTable]);

  // Persist to localStorage whenever cart state changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          items,
          customerName,
          customerPhone,
          orderNotes,
          paymentMethod,
          tableNumber,
        })
      );
    } catch (e) {
      console.warn('Failed to save cart to localStorage:', e);
    }
  }, [items, customerName, customerPhone, orderNotes, paymentMethod, tableNumber, storageKey, isLoaded]);

  const addItem = (item: MenuItem | CartItem, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: Number(item.price),
          is_veg: item.is_veg,
          image_url: item.image_url,
          quantity,
          notes: (item as CartItem).notes || '',
        },
      ];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) => {
      return prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const setItemQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const updateItemNotes = (id: string, notes: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notes } : item))
    );
  };

  const getItemQuantity = (id: string): number => {
    const found = items.find((i) => i.id === id);
    return found ? found.quantity : 0;
  };

  const clearCart = () => {
    setItems([]);
    setOrderNotes('');
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.warn('Failed to remove cart storage:', e);
    }
  };

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        restaurantSlug: slug,
        tableNumber,
        setTableNumber,
        items,
        addItem,
        removeItem,
        updateQuantity,
        setItemQuantity,
        updateItemNotes,
        getItemQuantity,
        clearCart,
        totalCount,
        subtotal,
        customerName,
        setCustomerName,
        customerPhone,
        setCustomerPhone,
        orderNotes,
        setOrderNotes,
        paymentMethod,
        setPaymentMethod,
        isDrawerOpen,
        setIsDrawerOpen,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
        isLoaded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
