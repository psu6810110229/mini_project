import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import type { Equipment } from '../types';

export default function AdminEquipments() {
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Equipment | null>(null);

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
            const response = await apiClient.get<Equipment[]>('/equipments');
            setEquipments(response.data);
        } catch (err) {
            console.error('Failed to load equipments');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this equipment?')) return;
        try {
            await apiClient.delete(`/equipments/${id}`);
            fetchEquipments();
        } catch (err) {
            alert('Failed to delete equipment');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await apiClient.patch(`/equipments/${editingItem.id}`, formData);
            } else {
                await apiClient.post('/equipments', formData);
            }
            setIsModalOpen(false);
            setEditingItem(null);
            setFormData({ name: '', category: '', stockQty: 1, imageUrl: '', status: 'AVAILABLE' });
            fetchEquipments();
        } catch (err) {
            alert('Failed to save equipment');
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

    if (loading) return <div className="p-8 text-white">Loading...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Manage Equipment</h1>
                <button
                    onClick={openCreate}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium shadow-lg shadow-blue-900/20"
                >
                    + Add New Equipment
                </button>
            </div>

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
                            <tr key={item.id} className="text-white hover:bg-gray-700/30">
                                <td className="p-4 font-medium">{item.name}</td>
                                <td className="p-4 text-gray-400">{item.category}</td>
                                <td className="p-4">{item.stockQty}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs ${item.status === 'AVAILABLE' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                        }`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="p-4 text-right space-x-2">
                                    <button
                                        onClick={() => openEdit(item)}
                                        className="text-blue-400 hover:text-blue-300"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-6">
                            {editingItem ? 'Edit Equipment' : 'Add New Equipment'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-gray-700 border-gray-600 rounded text-white p-2"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Category</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-gray-700 border-gray-600 rounded text-white p-2"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Stock Qty</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        className="w-full bg-gray-700 border-gray-600 rounded text-white p-2"
                                        value={formData.stockQty}
                                        onChange={e => setFormData({ ...formData, stockQty: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Status</label>
                                    <select
                                        className="w-full bg-gray-700 border-gray-600 rounded text-white p-2"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="AVAILABLE">AVAILABLE</option>
                                        <option value="MAINTENANCE">MAINTENANCE</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Image URL</label>
                                <input
                                    type="url"
                                    className="w-full bg-gray-700 border-gray-600 rounded text-white p-2"
                                    value={formData.imageUrl}
                                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-medium"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
