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
            <div
                className="min-h-screen text-white font-sans relative"
                style={{
                    backgroundImage: 'url(/main-bg.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundAttachment: 'fixed',
                }}
            >
                {/* Darker overlay for better text readability + brightness reduction */}
                <div
                    className="fixed inset-0 -z-10"
                    style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.65)',
                    }}
                />

                <Navbar />
                <main className="relative z-10">
                    <Outlet />
                </main>
                {isUser && <RentalListButton />}
            </div>
        </CartProvider>
    );
}
