import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Shield } from 'lucide-react';
import { UserRole } from '../types';

const Navbar = () => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    // 1. Clear Token (Critical Requirement)
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // 2. Redirect to Login
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-white shadow-sm border-b px-4 py-3 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <Link to="/equipments" className="text-xl font-bold text-blue-600 flex items-center gap-2">
          📸 Club Gear
        </Link>
        
        {/* Menu Links */}
        <div className="hidden md:flex gap-4 text-sm font-medium text-gray-600">
          <Link to="/equipments" className="hover:text-blue-600">All Equipments</Link>
          <Link to="/my-rentals" className="hover:text-blue-600">My Rentals</Link>
          {user.role === UserRole.ADMIN && (
            <Link to="/admin/rentals" className="text-purple-600 flex items-center gap-1">
              <Shield size={14} /> Admin Dashboard
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">Hi, {user.name}</span>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-1 text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded transition"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;