import { Navigate, Outlet } from 'react-router-dom';
import { UserRole } from '../types';

interface Props {
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ allowedRoles }: Props) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  // 1. ถ้าไม่มีของใน Storage -> เด้งไป Login
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  // 2. ถ้ามีการระบุ Role แต่ User ไม่ตรงเงื่อนไข
  if (allowedRoles) {
    const user = JSON.parse(userStr);
    if (!allowedRoles.includes(user.role)) {
      // Redirect admins to admin page, users to equipment list
      if (user.role === UserRole.ADMIN) {
        return <Navigate to="/admin/rentals" replace />;
      }
      return <Navigate to="/equipments" replace />;
    }
  }

  // 3. ผ่าน
  return <Outlet />;
};

export default ProtectedRoute;