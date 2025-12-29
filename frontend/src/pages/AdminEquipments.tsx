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
        <div className="p-8 max-w-7xl mx-auto">
            {/* Success/Error Messages */}
            {successMessage && (
                <div className="mb-6 flex gap-3 bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-green-400">{successMessage}</p>
                </div>
            )}
            
            {errorMessage && (
                <div className="mb-6 flex gap-3 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400">{errorMessage}</p>
                </div>
            )}
            
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Manage Equipment</h1>
                <button
                    onClick={openCreate}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-colors"
                >
                    <Plus className="h-4 w-4" />
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
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-900/50 text-gray-400">
                            <tr>
                                <th className="p-4">Name</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Stock</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {equipments.map((item) => (
                                <tr key={item.id} className="text-white hover:bg-gray-700/30 transition-colors">
                                    <td className="p-4 font-medium">{item.name}</td>
                                    <td className="p-4 text-gray-400">{item.category}</td>
                                    <td className="p-4">{item.stockQty}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${item.status === 'AVAILABLE' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right space-x-3">
                                        <button
                                            onClick={() => openEdit(item)}
                                            disabled={saving}
                                            className="text-blue-400 hover:text-blue-300 disabled:text-blue-700 transition-colors inline-flex items-center gap-1"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            disabled={saving}
                                            className="text-red-400 hover:text-red-300 disabled:text-red-700 transition-colors inline-flex items-center gap-1"
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm z-50">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-6">
                            {editingItem ? 'Edit Equipment' : 'Add New Equipment'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2 font-medium">Name *</label>
                                <input
                                    type="text"
                                    required
                                    disabled={saving}
                                    className="w-full bg-gray-700 border border-gray-600 rounded text-white p-3 disabled:opacity-50 focus:outline-none focus:border-blue-500"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Equipment name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2 font-medium">Category *</label>
                                <input
                                    type="text"
                                    required
                                    disabled={saving}
                                    className="w-full bg-gray-700 border border-gray-600 rounded text-white p-3 disabled:opacity-50 focus:outline-none focus:border-blue-500"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    placeholder="e.g., Camera, Microphone"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2 font-medium">Stock Qty *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        disabled={saving}
                                        className="w-full bg-gray-700 border border-gray-600 rounded text-white p-3 disabled:opacity-50 focus:outline-none focus:border-blue-500"
                                        value={formData.stockQty}
                                        onChange={e => setFormData({ ...formData, stockQty: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2 font-medium">Status *</label>
                                    <select
                                        disabled={saving}
                                        className="w-full bg-gray-700 border border-gray-600 rounded text-white p-3 disabled:opacity-50 focus:outline-none focus:border-blue-500"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="AVAILABLE">AVAILABLE</option>
                                        <option value="MAINTENANCE">MAINTENANCE</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2 font-medium">Image URL</label>
                                <input
                                    type="url"
                                    disabled={saving}
                                    className="w-full bg-gray-700 border border-gray-600 rounded text-white p-3 disabled:opacity-50 focus:outline-none focus:border-blue-500"
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
                                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700 disabled:opacity-50 rounded text-white font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-700 disabled:opacity-50 rounded text-white font-medium transition-colors"
                                >
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
