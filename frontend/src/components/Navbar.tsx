import { Link, useLocation } from 'react-router-dom';
import { UserRole } from '../types';

export default function Navbar() {
    const location = useLocation();
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isAdmin = user?.role === UserRole.ADMIN;

    const isActive = (path: string) => {
        return location.pathname.startsWith(path) ? 'text-blue-400' : 'text-gray-300 hover:text-white';
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
                                <Link to="/equipments" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/equipments')}`}>
                                    All Equipment
                                </Link>
                                <Link to="/my-rentals" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/my-rentals')}`}>
                                    My Rentals
                                </Link>

                                {isAdmin && (
                                    <>
                                        <span className="text-gray-600">|</span>
                                        <span className="text-gray-500 text-sm font-semibold uppercase tracking-wider ml-2">Admin Panel:</span>
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

                    <div className="text-white text-sm">
                        Hello, <span className="font-bold">{user?.name || 'User'}</span>
                    </div>
                </div>
            </div>
        </nav>
    );
}
