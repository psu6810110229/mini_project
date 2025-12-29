import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Equipments from './pages/Equipments'; // สร้างไฟล์เปล่าๆ รอไว้ก่อนก็ได้ หรือคอมเมนต์ไว้

function App() {
  return (
    <Routes>
      {/* 1. เข้ามาหน้าแรก ให้ดีดไป Login ก่อนเลย */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* 2. เส้นทางสำหรับหน้าจอต่างๆ */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* 3. หน้า Equipments (เดี๋ยวเราจะทำกันต่อ) */}
      <Route path="/equipments" element={<div>Equipments Page (Under Construction)</div>} />
      
      {/* 4. ดักจับ URL มั่วๆ ให้กลับไป Login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;