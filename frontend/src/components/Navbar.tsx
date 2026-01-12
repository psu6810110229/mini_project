import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isAdmin = user?.role === UserRole.ADMIN;

    const isActive = (path: string) => {
        return location.pathname.startsWith(path)
            ? 'text-white font-bold bg-white/20'
            : 'text-white/80 hover:text-white hover:bg-white/10';
    };

    const handleLogoutConfirm = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rentalCart');
        setShowLogoutModal(false);
        navigate('/login');
    };

    const handleLogoutClick = () => {
        setShowLogoutModal(true);
    };

    return (
        <>
            {/* Navbar - Blur effect */}
            <nav className="backdrop-blur-2xl bg-slate-900/60 border-b border-white/10 sticky top-0 z-50 shadow-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-8">
                            <Link to={isAdmin ? "/admin/rentals" : "/equipments"} className="flex flex-col font-bold leading-tight hover:opacity-80 transition-opacity">
                                <span className="text-lg text-white">🎓 Photo Club</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-s text-white/70">{isAdmin ? "Admin" : "Gear Rental System"}</span>
                                    <span className="px-1.5 py-0.5 bg-white/20 text-white text-[12px] rounded-full font-bold border border-white/30">V1.4TH</span>
                                </div>
                            </Link>

                            {/* Desktop Menu */}
                            <div className="hidden md:block">
                                <div className="flex items-baseline space-x-2">
                                    {!isAdmin && (
                                        <>
                                            <Link to="/equipments" className={`px-4 py-2 rounded-xl text-md font-medium transition-all ${isActive('/equipments')}`}>
                                                📦 อุปกรณ์ทั้งหมด
                                            </Link>
                                            <Link to="/my-rentals" className={`px-4 py-2 rounded-xl text-md font-medium transition-all ${isActive('/my-rentals')}`}>
                                                📋 รายการยืม
                                            </Link>
                                        </>
                                    )}

                                    {isAdmin && (
                                        <>
                                            <span className="text-white/60 text-xs font-bold uppercase tracking-widest"></span>
                                            <Link to="/equipments" className={`px-4 py-2 rounded-xl text-md font-medium transition-all ${isActive('/equipments')}`}>
                                                📦 ดูอุปกรณ์
                                            </Link>
                                            <Link to="/admin/equipments" className={`px-4 py-2 rounded-xl text-md font-medium transition-all ${isActive('/admin/equipments')}`}>
                                                🔧 จัดการ
                                            </Link>
                                            <Link to="/admin/rentals" className={`px-4 py-2 rounded-xl text-md font-medium transition-all ${isActive('/admin/rentals')}`}>
                                                📋 รายการยืม
                                            </Link>
                                            <Link to="/admin/audit-logs" className={`px-4 py-2 rounded-xl text-md font-medium transition-all ${isActive('/admin/audit-logs')}`}>
                                                📊 แดชบอร์ด
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden md:block text-white/80 text-sm font-medium">
                                👤 <span className="text-white font-bold">{user?.name || 'User'}</span>
                            </div>
                            <button
                                onClick={handleLogoutClick}
                                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-md font-medium text-white bg-red-600 hover:bg-red-700 transition-all duration-200 shadow-lg"
                            >
                                <LogOut className="h-4 w-4" />
                                ออกจากระบบ
                            </button>

                            {/* Mobile menu button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all"
                            >
                                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden py-4 border-t border-white/10 animate-slide-down">
                            <div className="flex flex-col space-y-2">
                                {!isAdmin && (
                                    <>
                                        <Link to="/equipments" onClick={() => setMobileMenuOpen(false)} className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive('/equipments')}`}>
                                            📦 อุปกรณ์ทั้งหมด
                                        </Link>
                                        <Link to="/my-rentals" onClick={() => setMobileMenuOpen(false)} className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive('/my-rentals')}`}>
                                            📋 รายการยืม
                                        </Link>
                                    </>
                                )}

                                {isAdmin && (
                                    <>
                                        <Link to="/equipments" onClick={() => setMobileMenuOpen(false)} className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive('/equipments')}`}>
                                            📦 ดูอุปกรณ์
                                        </Link>
                                        <Link to="/admin/equipments" onClick={() => setMobileMenuOpen(false)} className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive('/admin/equipments')}`}>
                                            🔧 จัดการอุปกรณ์
                                        </Link>
                                        <Link to="/admin/rentals" onClick={() => setMobileMenuOpen(false)} className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive('/admin/rentals')}`}>
                                            📋 รายการยืม
                                        </Link>
                                        <Link to="/admin/audit-logs" onClick={() => setMobileMenuOpen(false)} className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive('/admin/audit-logs')}`}>
                                            📊 แดชบอร์ด
                                        </Link>
                                    </>
                                )}

                                <div className="border-t border-white/10 pt-4 mt-2">
                                    <div className="px-4 text-white/80 text-sm mb-3">
                                        👤 <span className="text-white font-bold">{user?.name || 'User'}</span>
                                    </div>
                                    <button
                                        onClick={handleLogoutClick}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-all"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        ออกจากระบบ
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Logout Confirmation Modal - Blur effect */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="backdrop-blur-2xl bg-slate-900/70 rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-white/20 animate-scale-in">
                        <h3 className="text-lg font-bold text-white mb-2">⚠️ ยืนยันการออกจากระบบ</h3>
                        <p className="text-white/70 mb-6">คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-white/10 hover:bg-white/20 backdrop-blur-xl transition-all duration-200 border border-white/20"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleLogoutConfirm}
                                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg transition-all duration-200"
                            >
                                ออกจากระบบ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slide-down {
                    from { opacity: 0; max-height: 0; }
                    to { opacity: 1; max-height: 500px; }
                }
                .animate-slide-down {
                    animation: slide-down 0.3s ease-out forwards;
                }
                @keyframes scale-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-scale-in {
                    animation: scale-in 0.2s ease-out forwards;
                }
            `}</style>
        </>
    );
}
