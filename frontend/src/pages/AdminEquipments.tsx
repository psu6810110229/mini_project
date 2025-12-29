import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import type { Equipment } from '../types';
import { AlertCircle, CheckCircle, Trash2, Edit2, Plus } from 'lucide-react';

export default function AdminEquipments() {
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Equipment | null>(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        stockQty: 1,
        imageUrl: '',
        status: 'AVAILABLE'
    });

    useEffect(() => {
        fetchEquipments();
    }, []);

    const fetchEquipments = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get<Equipment[]>('/equipments');
            setEquipments(response.data);
            setErrorMessage('');
        } catch (err: any) {
            console.error('Failed to load equipments', err);
            setErrorMessage('Failed to load equipments. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this equipment?')) return;
        try {
            setSaving(true);
            await apiClient.delete(`/equipments/${id}`);
            setSuccessMessage('Equipment deleted successfully!');
            fetchEquipments();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to delete equipment';
            setErrorMessage(message);
            console.error('Failed to delete equipment', err);
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            setErrorMessage('');
            
            if (editingItem) {
                await apiClient.patch(`/equipments/${editingItem.id}`, formData);
                setSuccessMessage('Equipment updated successfully!');
            } else {
                await apiClient.post('/equipments', formData);
                setSuccessMessage('Equipment created successfully!');
            }
            
            setIsModalOpen(false);
            setEditingItem(null);
            setFormData({ name: '', category: '', stockQty: 1, imageUrl: '', status: 'AVAILABLE' });
            fetchEquipments();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to save equipment';
            setErrorMessage(message);
            console.error('Failed to save equipment', err);
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (item: Equipment) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            category: item.category,
            stockQty: item.stockQty,
            imageUrl: item.imageUrl || '',
            status: item.status
        });
        setIsModalOpen(true);
    };

    const openCreate = () => {
        setEditingItem(null);
        setFormData({ name: '', category: '', stockQty: 1, imageUrl: '', status: 'AVAILABLE' });
        setIsModalOpen(true);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen">
            {/* Success/Error Messages */}
            {successMessage && (
                <div className="mb-6 flex gap-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 backdrop-blur rounded-xl p-4 shadow-lg shadow-green-500/10 animate-slideDown">
                    <CheckCircle className="h-5 w-5 text-green-300 flex-shrink-0 mt-0.5" />
                    <p className="text-green-300 font-medium">{successMessage}</p>
                </div>
            )}
            
            {errorMessage && (
                <div className="mb-6 flex gap-3 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/40 backdrop-blur rounded-xl p-4 shadow-lg shadow-red-500/10 animate-slideDown">
                    <AlertCircle className="h-5 w-5 text-red-300 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 font-medium">{errorMessage}</p>
                </div>
            )}
            
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">🔧 Manage Equipment</h1>
                <button
                    onClick={openCreate}
                    disabled={saving}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3 rounded-lg font-bold shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all duration-200 transform hover:scale-105"
                >
                    <Plus className="h-5 w-5" />
                    Add New Equipment
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="text-gray-400">Loading equipments...</div>
                </div>
            ) : equipments.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-gray-400">No equipments found. Create one to get started!</div>
                </div>
            ) : (
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-blue-500/20 overflow-hidden shadow-xl shadow-blue-500/5">
                    <table className="w-full text-left">
                        <thead className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-blue-500/20">
                            <tr>
                                <th className="p-4 text-blue-300 font-bold">Name</th>
                                <th className="p-4 text-blue-300 font-bold">Category</th>
                                <th className="p-4 text-blue-300 font-bold">Stock</th>
                                <th className="p-4 text-blue-300 font-bold">Status</th>
                                <th className="p-4 text-right text-blue-300 font-bold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-500/10">
                            {equipments.map((item) => (
                                <tr key={item.id} className="text-gray-200 hover:bg-blue-500/10 transition-colors duration-150">
                                    <td className="p-4 font-medium">{item.name}</td>
                                    <td className="p-4 text-gray-400">{item.category}</td>
                                    <td className="p-4">{item.stockQty}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur transition-all ${
                                            item.status === 'AVAILABLE' 
                                                ? 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-300 border border-green-500/40' 
                                                : 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 text-yellow-300 border border-yellow-500/40'
                                        }`}>
                                            {item.status === 'AVAILABLE' ? '✓' : '⚠'} {item.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right space-x-3">
                                        <button
                                            onClick={() => openEdit(item)}
                                            disabled={saving}
                                            className="text-blue-300 hover:text-blue-200 disabled:opacity-50 transition-all inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-500/10"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            disabled={saving}
                                            className="text-red-300 hover:text-red-200 disabled:opacity-50 transition-all inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-500/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 backdrop-blur-md z-50 animate-fadeIn">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl w-full max-w-md border border-blue-500/30 shadow-2xl shadow-blue-500/20 p-6 backdrop-blur-xl">
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-6">
                            {editingItem ? '✏️ Edit Equipment' : '➕ Add New Equipment'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-blue-300 mb-2 font-bold">📦 Name *</label>
                                <input
                                    type="text"
                                    required
                                    disabled={saving}
                                    className="w-full bg-white/10 border border-blue-400/30 rounded-lg text-white p-3 disabled:opacity-50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 backdrop-blur placeholder-gray-400 transition-all"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Equipment name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-blue-300 mb-2 font-bold">🏷️ Category *</label>
                                <input
                                    type="text"
                                    required
                                    disabled={saving}
                                    className="w-full bg-white/10 border border-blue-400/30 rounded-lg text-white p-3 disabled:opacity-50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 backdrop-blur placeholder-gray-400 transition-all"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    placeholder="e.g., Camera, Microphone"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-blue-300 mb-2 font-bold">📊 Stock Qty *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        disabled={saving}
                                        className="w-full bg-white/10 border border-blue-400/30 rounded-lg text-white p-3 disabled:opacity-50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 backdrop-blur transition-all"
                                        value={formData.stockQty}
                                        onChange={e => setFormData({ ...formData, stockQty: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-blue-300 mb-2 font-bold">✓ Status *</label>
                                    <select
                                        disabled={saving}
                                        className="w-full bg-white/10 border border-blue-400/30 rounded-lg text-white p-3 disabled:opacity-50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 backdrop-blur transition-all"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="AVAILABLE">AVAILABLE</option>
                                        <option value="MAINTENANCE">MAINTENANCE</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-blue-300 mb-2 font-bold">🖼️ Image URL</label>
                                <input
                                    type="url"
                                    disabled={saving}
                                    className="w-full bg-white/10 border border-blue-400/30 rounded-lg text-white p-3 disabled:opacity-50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 backdrop-blur placeholder-gray-400 transition-all"
                                    value={formData.imageUrl}
                                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>

                            <div className="flex gap-3 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-lg text-gray-300 font-bold border border-white/20 transition-all duration-200"
                                >
                                    ✕ Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 rounded-lg text-white font-bold shadow-lg shadow-blue-500/30 transition-all duration-200 transform hover:scale-105"
                                >
                                    {saving ? '⏳ Saving...' : '💾 Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
