import axios from 'axios';

const apiClient = axios.create({
  // เพิ่ม /api ต่อท้าย port 3000
  baseURL: 'http://localhost:3000/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor สำหรับใส่ Token (คงเดิมไว้)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;