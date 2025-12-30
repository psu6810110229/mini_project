import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { CartItem } from '../types';

const CART_STORAGE_KEY = 'equipment_cart';
const CART_EXPIRY_MINUTES = 15;

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (item: Omit<CartItem, 'addedAt' | 'expiresAt'>) => boolean;
    removeFromCart: (itemId: string) => void;
    clearCart: () => void;
    isInCart: (itemId: string) => boolean;
    getTimeRemaining: (itemId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    // Load cart from localStorage and filter expired items
    const loadCart = useCallback(() => {
        try {
            const stored = localStorage.getItem(CART_STORAGE_KEY);
            if (stored) {
                const items: CartItem[] = JSON.parse(stored);
                const now = Date.now();
                const validItems = items.filter(item => item.expiresAt > now);
                if (validItems.length !== items.length) {
                    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(validItems));
                }
                return validItems;
            }
        } catch (e) {
            console.error('Failed to load cart', e);
        }
        return [];
    }, []);

    // Initialize cart on mount
    useEffect(() => {
        setCartItems(loadCart());
    }, [loadCart]);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }, [cartItems]);

    // Auto-clean expired items every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setCartItems(prev => {
                const validItems = prev.filter(item => item.expiresAt > now);
                if (validItems.length !== prev.length) {
                    return validItems;
                }
                return prev;
            });
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const addToCart = useCallback((item: Omit<CartItem, 'addedAt' | 'expiresAt'>): boolean => {
        // Check if item already in cart
        const existingIndex = cartItems.findIndex(c => c.itemId === item.itemId);
        if (existingIndex >= 0) {
            return false;
        }

        const now = Date.now();
        const newItem: CartItem = {
            ...item,
            addedAt: now,
            expiresAt: now + CART_EXPIRY_MINUTES * 60 * 1000,
        };

        setCartItems(prev => [...prev, newItem]);
        return true;
    }, [cartItems]);

    const removeFromCart = useCallback((itemId: string) => {
        setCartItems(prev => prev.filter(item => item.itemId !== itemId));
    }, []);

    const clearCart = useCallback(() => {
        setCartItems([]);
        localStorage.removeItem(CART_STORAGE_KEY);
    }, []);

    const isInCart = useCallback((itemId: string): boolean => {
        return cartItems.some(item => item.itemId === itemId);
    }, [cartItems]);

    const getTimeRemaining = useCallback((itemId: string): number => {
        const item = cartItems.find(c => c.itemId === itemId);
        if (!item) return 0;
        return Math.max(0, item.expiresAt - Date.now());
    }, [cartItems]);

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            clearCart,
            isInCart,
            getTimeRemaining,
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
