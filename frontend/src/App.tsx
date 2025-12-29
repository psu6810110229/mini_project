import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar'; // Import Navbar
import { UserRole } from './types';

// Create a Layout Component
const MainLayout = () => (
  <>
    <Navbar />
    <div className="max-w-6xl mx-auto p-4">
      <Outlet />
    </div>
  </>
);

function App() {
  return (
    <Routes>
      {/* Public Routes (No Navbar) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Protected Routes (With Navbar) */}
      <Route element={<ProtectedRoute allowedRoles={[UserRole.USER, UserRole.ADMIN]} />}>
        <Route element={<MainLayout />}> {/* Wrap with Layout */}
          
          {/* USER PAGES */}
          <Route path="/equipments" element={<div className="p-8"><h1>Equipments List (Next Step)</h1></div>} />
          <Route path="/my-rentals" element={<div className="p-8"><h1>My Rentals History</h1></div>} />

          {/* ADMIN PAGES */}
          <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
            <Route path="/admin/rentals" element={<div className="p-8"><h1>Admin Dashboard</h1></div>} />
          </Route>

        </Route>
      </Route>
    </Routes>
  );
}

export default App;