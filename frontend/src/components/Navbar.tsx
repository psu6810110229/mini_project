import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { LogOut } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isAdmin = user?.role === UserRole.ADMIN;

    const isActive = (path: string) => {
        return location.pathname.startsWith(path) ? 'text-gray-900 font-bold' : 'text-gray-700 hover:text-gray-900';
    };

    const handleLogoutConfirm = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('rememberMe');
        setShowLogoutModal(false);
        navigate('/login');
    };

    const handleLogoutClick = () => {
        setShowLogoutModal(true);
    };

    return (
        <nav className="bg-gradient-to-r from-blue-50 via-slate-50 to-teal-50 border-b border-slate-200 sticky top-0 z-50 backdrop-blur-md shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-8">
                        <Link to={isAdmin ? "/admin/rentals" : "/equipments"} className="flex flex-col font-bold leading-tight hover:opacity-80 transition-opacity">
                            <span className="text-lg bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">🎓 University Club Gear</span>
                            <span className="text-xs text-gray-700">{isAdmin ? "Admin Panel" : "Rental System"}</span>
                        </Link>

                        <div className="hidden md:block">
                            <div className="flex items-baseline space-x-4">
                                {!isAdmin && (
                                    <>
                                        <Link to="/equipments" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/equipments')} hover:bg-white/10`}>
                                            📦 All Equipment
                                        </Link>
                                        <Link to="/my-rentals" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/my-rentals')} hover:bg-white/10`}>
                                            📋 My Rentals
                                        </Link>
                                    </>
                                )}

                                {isAdmin && (
                                    <>
                                        <span className="text-gray-800 text-xs font-bold uppercase tracking-widest">⚙️ Admin:</span>
                                        <Link to="/equipments" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/equipments')} hover:bg-white/10`}>
                                            📦 View Equipment
                                        </Link>
                                        <Link to="/admin/equipments" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/admin/equipments')} hover:bg-white/10`}>
                                            🔧 Manage
                                        </Link>
                                        <Link to="/admin/rentals" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/admin/rentals')} hover:bg-white/10`}>
                                            📊 Rentals
                                        </Link>
                                        <Link to="/admin/audit-logs" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/admin/audit-logs')} hover:bg-white/10`}>
                                            📝 Logs
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-gray-700 text-sm font-medium">
                            👤 <span className="text-gray-900 font-bold">{user?.name || 'User'}</span>
                        </div>
                        <button
                            onClick={handleLogoutClick}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 transition-all duration-200"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 max-w-sm mx-4 border border-gray-300/40">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">⚠️ Confirm Logout</h3>
                        <p className="text-gray-700 mb-6">Are you sure you want to logout?</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 border border-gray-300 transition-all duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogoutConfirm}
                                className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/30 transition-all duration-200"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
