import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

// Cart item interface - represents a reserved equipment item
export interface CartItem {
    itemId: string;          // The specific equipment item ID
    itemCode: string;        // Human-readable item code
    equipmentId: string;     // The equipment type ID
    equipmentName: string;   // Name of the equipment
    equipmentImage?: string; // Optional image URL
    addedAt?: number;        // When it was added
    expiresAt: number;       // Timestamp when reservation expires
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (item: Omit<CartItem, 'addedAt' | 'expiresAt'>) => boolean;
    removeFromCart: (itemId: string) => void;
    clearCart: () => void;
    isInCart: (itemId: string) => boolean;
    getTimeRemaining: (itemId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'rentalCart';
const CART_EXPIRY_MINUTES = 15;

export function CartProvider({ children }: { children: ReactNode }) {
    const [cartItems, setCartItems] = useState<CartItem[]>(() => {
        // Load from localStorage on initial render
        const saved = localStorage.getItem(CART_STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as CartItem[];
                // Filter out expired items
                const now = Date.now();
                return parsed.filter(item => item.expiresAt > now);
            } catch {
                return [];
            }
        }
        return [];
    });

    // Save to localStorage whenever cart changes
    useEffect(() => {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }, [cartItems]);

    // Remove expired items periodically
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setCartItems(prev => {
                const filtered = prev.filter(item => item.expiresAt > now);
                if (filtered.length !== prev.length) {
                    return filtered;
                }
                return prev;
            });
        }, 1000);

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

export function useCart(): CartContextType {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
