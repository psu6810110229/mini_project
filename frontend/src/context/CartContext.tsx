import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

/**
 * =====================================================================
 * CartContext.tsx - ระบบตะกร้าสินค้าพร้อมหมดอายุอัตโนมัติ
 * =====================================================================
 * 
 * ทำไมต้องมี Context นี้?
 * - ให้ทุก Component เข้าถึงข้อมูลตะกร้าได้โดยไม่ต้อง pass props หลายชั้น
 * - เก็บข้อมูลลง localStorage เพื่อไม่หายเมื่อรีเฟรชหน้า
 * - มีระบบหมดอายุอัตโนมัติ 15 นาที เพื่อป้องกันการกั๊กของ
 * 
 * การทำงาน:
 * 1. เมื่อเพิ่มของลงตะกร้า → บันทึก timestamp + เวลาหมดอายุ
 * 2. setInterval ทำงานทุก 1 วินาที → ตรวจสอบของหมดอายุ
 * 3. ถ้าหมดอายุ → ลบออกจากตะกร้าอัตโนมัติ
 * =====================================================================
 */

// CartItem interface - ข้อมูลอุปกรณ์ที่เลือกไว้ในตะกร้า
export interface CartItem {
    itemId: string;          // ID ของอุปกรณ์ชิ้นนั้น (เช่น กล้องตัวที่ 1)
    itemCode: string;        // รหัสอุปกรณ์ (เช่น "001")
    equipmentId: string;     // ID ของประเภทอุปกรณ์ (เช่น Canon 5D)
    equipmentName: string;   // ชื่ออุปกรณ์
    equipmentImage?: string; // รูปอุปกรณ์ (ถ้ามี)
    addedAt?: number;        // เวลาที่เพิ่มเข้าตะกร้า (Unix timestamp)
    expiresAt: number;       // เวลาหมดอายุ (Unix timestamp)
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

// ===================== CONFIGURATION =====================
const CART_STORAGE_KEY = 'rentalCart';  // Key สำหรับเก็บใน localStorage
const CART_EXPIRY_MINUTES = 15;          // หมดอายุหลังจากเพิ่ม 15 นาที

export function CartProvider({ children }: { children: ReactNode }) {
    // โหลดข้อมูลจาก localStorage ตอนเริ่มต้น และกรองของหมดอายุออก
    const [cartItems, setCartItems] = useState<CartItem[]>(() => {
        const saved = localStorage.getItem(CART_STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as CartItem[];
                const now = Date.now();
                return parsed.filter(item => item.expiresAt > now); // กรองของหมดอายุออก
            } catch {
                return [];
            }
        }
        return [];
    });

    // บันทึกลง localStorage ทุกครั้งที่ตะกร้าเปลี่ยน
    useEffect(() => {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }, [cartItems]);

    // ===================== TIMER LOGIC (สำคัญมาก!) =====================
    // ระบบตรวจสอบของหมดอายุ - ทำงานทุก 1 วินาที
    // เหตุผล: ถ้าคนกั๊กของไว้นานเกินไป ของจะถูกปลดปล่อยให้คนอื่นจองได้
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setCartItems(prev => {
                // กรองเฉพาะของที่ยังไม่หมดอายุ
                const filtered = prev.filter(item => item.expiresAt > now);
                // ถ้าจำนวนเปลี่ยน = มีของหมดอายุ → อัปเดต state
                if (filtered.length !== prev.length) {
                    return filtered;
                }
                return prev; // ไม่มีการเปลี่ยนแปลง
            });
        }, 1000); // ทุก 1 วินาที

        return () => clearInterval(interval); // Cleanup เมื่อ unmount
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
