import { Routes, Route, Navigate } from 'react-router-dom';

// ===== หน้า Pages =====
import Login from './pages/Login';                                        // หน้า Login
import Register from './pages/Register';                                  // หน้าสมัครสมาชิก
import NotFound from './pages/NotFound';                                  // หน้า 404

// ===== User Pages =====
import EquipmentList from './pages/EquipmentList';                        // รายการอุปกรณ์ทั้งหมด
import EquipmentDetail from './pages/EquipmentDetail';                    // รายละเอียดอุปกรณ์
import MyRentals from './pages/MyRentals';                                // ประวัติการยืมของ user

// ===== Admin Pages =====
import AdminEquipments from './pages/AdminEquipments';                    // จัดการอุปกรณ์ (CRUD)
import AdminRentals from './pages/AdminRentals';                          // จัดการคำขอยืม
import AdminAuditLogs from './pages/AdminAuditLogs';                      // ดู audit logs

// ===== Components =====
import ProtectedRoute from './components/ProtectedRoute';                 // ตรวจสอบ login + role
import Layout from './components/Layout';                                 // Layout หลัก (Navbar + content)
import { UserRole } from './types';                                       // Type constants

function App() {
  return (
    <Routes>
      {/* ===== Public Routes - ไม่ต้อง login ===== */}
      <Route path="/login" element={<Login />} />                         {/* หน้า Login */}
      <Route path="/register" element={<Register />} />                   {/* หน้าสมัคร */}
      <Route path="/" element={<Navigate to="/login" replace />} />       {/* Redirect root → login */}

      {/* ===== Protected Routes - ต้อง login + มี Layout ===== */}
      <Route element={<Layout />}>                                        {/* ครอบด้วย Navbar */}

        {/* Routes สำหรับทั้ง USER และ ADMIN */}
        <Route element={<ProtectedRoute allowedRoles={[UserRole.USER, UserRole.ADMIN]} />}>
          <Route path="/equipments" element={<EquipmentList />} />        {/* ดูรายการอุปกรณ์ */}
          <Route path="/equipments/:id" element={<EquipmentDetail />} />  {/* ดูรายละเอียด + ยืม */}
        </Route>

        {/* Routes สำหรับ USER เท่านั้น */}
        <Route element={<ProtectedRoute allowedRoles={[UserRole.USER]} />}>
          <Route path="/my-rentals" element={<MyRentals />} />            {/* ประวัติยืมของตัวเอง */}
        </Route>

        {/* Routes สำหรับ ADMIN เท่านั้น */}
        <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
          <Route path="/admin/equipments" element={<AdminEquipments />} />{/* จัดการอุปกรณ์ */}
          <Route path="/admin/rentals" element={<AdminRentals />} />      {/* จัดการคำขอยืม */}
          <Route path="/admin/audit-logs" element={<AdminAuditLogs />} /> {/* ดู logs */}
        </Route>
      </Route>

      {/* ===== 404 Page ===== */}
      <Route path="*" element={<NotFound />} />                           {/* Route ที่ไม่ match เลย */}
    </Routes>
  );
}

export default App;
