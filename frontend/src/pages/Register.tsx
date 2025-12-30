import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { UserPlus, User, Lock, IdCard } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    studentId: '',
    password: '',
    name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Added Loading state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Matches Backend: POST /auth/register
      await apiClient.post('/auth/register', formData);
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4">
      <div className="max-w-md w-full bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-8 border border-gray-300/40">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Create Account</h2>
        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm border border-red-200 backdrop-blur font-semibold">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Student ID</label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
              <input 
                required
                className="pl-10 w-full bg-white/70 border border-gray-300 rounded-lg py-3 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent backdrop-blur transition-all"
                placeholder="681xxxxxxx"
                value={formData.studentId}
                onChange={e => setFormData({...formData, studentId: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
            <div className="relative">
              <IdCard className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
              <input 
                required
                className="pl-10 w-full bg-white/70 border border-gray-300 rounded-lg py-3 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent backdrop-blur transition-all"
                placeholder="Somchai Jai-dee"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
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
                className="pl-10 w-full bg-white/70 border border-gray-300 rounded-lg py-3 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent backdrop-blur transition-all"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg shadow-lg font-bold flex justify-center items-center gap-2 transition-all transform hover:scale-105 hover:shadow-xl"
          >
            {loading ? 'Creating...' : (
              <>
                <UserPlus size={18} /> Create Account
              </>
            )}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-700">
          Already have an account? <Link to="/login" className="text-gray-600 font-bold hover:text-gray-700 transition-colors">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;