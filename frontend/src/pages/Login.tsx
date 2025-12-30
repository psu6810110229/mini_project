import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import type { AuthResponse } from '../types';
import { Lock, User } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // NOTE: This endpoint must match your friend's Backend
      const { data } = await apiClient.post<AuthResponse>('/auth/login', {
        studentId,
        password,
      });

      // Store in LocalStorage
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect based on role
      if (data.user.role === 'ADMIN') {
        navigate('/admin/rentals');
      } else {
        navigate('/equipments');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4">
      <div className="max-w-md w-full bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-8 border border-gray-300/40">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Login</h2>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4 border border-red-200 backdrop-blur font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Student ID</label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
              <input
                type="text"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="pl-10 w-full bg-white/70 border border-gray-300 rounded-lg py-3 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent backdrop-blur transition-all"
                placeholder="6xxxxxxxxx"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 w-full bg-white/70 border border-gray-300 rounded-lg py-3 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent backdrop-blur transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg shadow-lg font-bold flex justify-center items-center gap-2 transition-all transform hover:scale-105 hover:shadow-xl"
          >
            {loading ? 'Processing...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-700">
          Need an account? <Link to="/register" className="text-gray-600 font-bold hover:text-gray-700 transition-colors">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;