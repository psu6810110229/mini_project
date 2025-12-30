import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import RentalListButton from './CartButton';
import { CartProvider } from '../context/CartContext';
import { UserRole } from '../types';

export default function Layout() {
    // Check if user is not admin (show rental list only for users)
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isUser = user?.role === UserRole.USER;

    return (
        <CartProvider>
            <div className="min-h-screen bg-gray-900 text-white font-sans">
                <Navbar />
                <main>
                    <Outlet />
                </main>
                {isUser && <RentalListButton />}
            </div>
        </CartProvider>
    );
}
