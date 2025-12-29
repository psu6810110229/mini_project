import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import { UserRole } from './types';
import EquipmentList from './pages/EquipmentList';
import EquipmentDetail from './pages/EquipmentDetail';
import AdminEquipments from './pages/AdminEquipments';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* User Routes (Protected) */}
      <Route element={<ProtectedRoute allowedRoles={[UserRole.USER, UserRole.ADMIN]} />}>
        <Route path="/equipments" element={<EquipmentList />} />
        <Route path="/equipments/:id" element={<EquipmentDetail />} />
        <Route path="/my-rentals" element={<div className="p-8"><h1>My Rentals Page (Todo)</h1></div>} />
      </Route>

      {/* Admin Routes (Protected + Role Check) */}
      <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
        <Route path="/admin/equipments" element={<AdminEquipments />} />
        <Route path="/admin/rentals" element={<div className="p-8"><h1>Admin Dashboard (Todo)</h1></div>} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;