import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import { UserRole } from './types';
import EquipmentList from './pages/EquipmentList';
import EquipmentDetail from './pages/EquipmentDetail';
import AdminEquipments from './pages/AdminEquipments';
import MyRentals from './pages/MyRentals';
import AdminRentals from './pages/AdminRentals';
import AdminAuditLogs from './pages/AdminAuditLogs';

import Layout from './components/Layout';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Protected Routes with Layout */}
      <Route element={<Layout />}>
        {/* User Routes - Equipment viewing available to all, but rental only for users */}
        <Route element={<ProtectedRoute allowedRoles={[UserRole.USER, UserRole.ADMIN]} />}>
          <Route path="/equipments" element={<EquipmentList />} />
          <Route path="/equipments/:id" element={<EquipmentDetail />} />
        </Route>

        {/* User-only routes - Only for regular users */}
        <Route element={<ProtectedRoute allowedRoles={[UserRole.USER]} />}>
          <Route path="/my-rentals" element={<MyRentals />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
          <Route path="/admin/equipments" element={<AdminEquipments />} />
          <Route path="/admin/rentals" element={<AdminRentals />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;