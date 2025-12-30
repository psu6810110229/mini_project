import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

// Cart item interface - represents a reserved equipment item
export interface CartItem {
    itemId: string;          // The specific equipment item ID
    itemCode: string;        // Human-readable item code
    equipmentId: string;     // The equipment type ID
    equipmentName: string;   // Name of the equipment
    equipmentImage?: string; // Optional image URL
    expiresAt: number;       // Timestamp when reservation expires
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (itemId: string) => void;
    clearCart: () => void;
    isInCart: (itemId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Reservation duration: 15 minutes
const RESERVATION_DURATION = 15 * 60 * 1000;

export function CartProvider({ children }: { children: ReactNode }) {
    const [cartItems, setCartItems] = useState<CartItem[]>(() => {
        // Load from localStorage on initial render
        const saved = localStorage.getItem('rentalCart');
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
        localStorage.setItem('rentalCart', JSON.stringify(cartItems));
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

    const addToCart = useCallback((item: CartItem) => {
        setCartItems(prev => {
            // Check if item already exists
            if (prev.some(i => i.itemId === item.itemId)) {
                return prev;
            }
            // Add item with expiration time
            return [...prev, {
                ...item,
                expiresAt: item.expiresAt || Date.now() + RESERVATION_DURATION
            }];
        });
    }, []);

    const removeFromCart = useCallback((itemId: string) => {
        setCartItems(prev => prev.filter(item => item.itemId !== itemId));
    }, []);

    const clearCart = useCallback(() => {
        setCartItems([]);
    }, []);

    const isInCart = useCallback((itemId: string) => {
        return cartItems.some(item => item.itemId === itemId);
    }, [cartItems]);

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            clearCart,
            isInCart
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
