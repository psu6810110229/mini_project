import { Navigate, Outlet } from 'react-router-dom';
import { UserRole } from '../types';

interface Props {
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ allowedRoles }: Props) => {
  // 1. Check for token
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  // 2. Check for Role (if specified)
  if (allowedRoles) {
    const user = JSON.parse(userStr);
    if (!allowedRoles.includes(user.role)) {
      // If User tries to access Admin page -> Send to their home
      return <Navigate to="/equipments" replace />;
    }
  }

  // 3. Allow access
  return <Outlet />;
};

export default ProtectedRoute;