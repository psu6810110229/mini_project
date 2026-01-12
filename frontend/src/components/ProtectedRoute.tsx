import { Navigate, Outlet } from 'react-router-dom';
import { UserRole } from '../types';

/**
 * =====================================================================
 * ProtectedRoute.tsx - Route Guard สำหรับป้องกัน Route
 * =====================================================================
 * 
 * หน้าที่: ป้องกันไม่ให้ User เข้าถึงหน้าที่ไม่ได้รับอนุญาต
 * 
 * การทำงาน:
 * 1. เช็คว่า Login แล้วหรือยัง (มี token ใน localStorage?)
 * 2. ถ้า Login แล้ว → เช็คว่า Role ตรงกับที่กำหนดหรือไม่
 * 3. ถ้าผ่านทั้งหมด → แสดงหน้าที่ร้องขอ
 * 4. ถ้าไม่ผ่าน → Redirect ไปหน้าที่เหมาะสม
 * 
 * ตัวอย่างการใช้:
 * <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
 *   <Route path="/admin/*" element={<AdminDashboard />} />
 * </Route>
 * =====================================================================
 */

interface Props {
  allowedRoles?: UserRole[];  // Role ที่อนุญาตให้เข้า (ถ้าไม่ระบุ = ทุก role)
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