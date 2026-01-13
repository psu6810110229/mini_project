import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'                         // จัดการ routing URL
import App from './App.tsx'                                               // Root component
import { CartProvider } from './context/CartContext'                      // Context สำหรับตะกร้ายืม
import './index.css'                                                      // Global styles

// Render React app ลงใน DOM element ที่มี id="root"
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>                                                      {/* ช่วยตรวจจับ bugs ใน dev mode */}
    <BrowserRouter>                                                       {/* ให้ใช้ React Router ได้ทั้งแอป */}
      <CartProvider>                                                      {/* ให้ทุก component เข้าถึง Cart state */}
        <App />                                                           {/* Root component */}
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>,
)