import axios from 'axios';

// ===== สร้าง Axios Instance สำหรับเรียก API =====
const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',                                   // Backend URL (NestJS)
  headers: {
    'Content-Type': 'application/json',                                   // ส่งข้อมูลแบบ JSON
  },
});

// ===== Request Interceptor - ใส่ JWT Token ทุก request =====
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');                          // ดึง token จาก localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;                   // ใส่ใน Authorization header
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ===== Response Interceptor - จัดการ Error =====
apiClient.interceptors.response.use(
  (response) => response,                                                 // สำเร็จ → return ปกติ
  (error) => {
    if (error.response?.status === 401) {                                 // Token หมดอายุ หรือ invalid
      // Clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirect ไป login (ถ้ายังไม่อยู่หน้า login)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;