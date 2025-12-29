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
        return location.pathname.startsWith(path) ? 'text-blue-400' : 'text-gray-300 hover:text-white';
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
        <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-8">
                        <Link to="/equipments" className="text-xl font-bold text-white">
                            Club Gear
                        </Link>

                        <div className="hidden md:block">
                            <div className="flex items-baseline space-x-4">
                                {!isAdmin && (
                                    <>
                                        <Link to="/equipments" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/equipments')}`}>
                                            All Equipment
                                        </Link>
                                        <Link to="/my-rentals" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/my-rentals')}`}>
                                            My Rentals
                                        </Link>
                                    </>
                                )}

                                {isAdmin && (
                                    <>
                                        <span className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Admin Panel:</span>
                                        <Link to="/admin/equipments" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/admin/equipments')}`}>
                                            Equipments
                                        </Link>
                                        <Link to="/admin/rentals" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/admin/rentals')}`}>
                                            Rentals
                                        </Link>
                                        <Link to="/admin/audit-logs" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/admin/audit-logs')}`}>
                                            Logs
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-white text-sm">
                            Hello, <span className="font-bold">{user?.name || 'User'}</span>
                        </div>
                        <button
                            onClick={handleLogoutClick}
                            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Logout</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogoutConfirm}
                                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
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
