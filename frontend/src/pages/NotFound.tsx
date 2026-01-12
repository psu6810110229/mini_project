/**
 * NotFound Page
 * 
 * Displays a friendly "Page Not Found" message for invalid URLs.
 * Logged-in users stay logged in, not redirected to login.
 */
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    const userStr = localStorage.getItem('user');
    const isLoggedIn = !!userStr;

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="backdrop-blur-2xl bg-slate-900/60 rounded-3xl border border-white/20 p-12 text-center max-w-md w-full">
                {/* 404 Icon */}
                <div className="text-8xl font-bold text-white/20 mb-4">404</div>

                {/* Message */}
                <h1 className="text-2xl font-bold text-white mb-2">ไม่พบหน้านี้</h1>
                <p className="text-white/60 mb-8">
                    หน้าที่คุณต้องการไม่มีอยู่หรือถูกย้ายแล้ว
                </p>

                {/* Navigation Buttons */}
                <div className="flex flex-col gap-3">
                    {isLoggedIn ? (
                        <Link to="/equipments" className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all">
                            <Home className="w-5 h-5" />
                            ไปยังอุปกรณ์
                        </Link>
                    ) : (
                        <Link to="/login" className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all">
                            <ArrowLeft className="w-5 h-5" />
                            กลับสู่หน้าเข้าสู่ระบบ
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
