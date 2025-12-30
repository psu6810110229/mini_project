import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import type { Equipment, EquipmentItem } from '../types';
import { EquipmentItemStatus } from '../types';
import { AlertCircle, CheckCircle, Trash2, Edit2, Plus, ChevronDown, ChevronUp } from 'lucide-react';

export default function AdminEquipments() {
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Equipment | null>(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [searchName, setSearchName] = useState('');
    const [expandedEquipment, setExpandedEquipment] = useState<string | null>(null);

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
            setFilteredEquipments(response.data);
            setErrorMessage('');
        } catch (err: any) {
            console.error('Failed to load equipments', err);
            setErrorMessage('Failed to load equipments. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let filtered = [...equipments];
        if (filterStatus) {
            // Filter by equipment status OR by any item having the status
            filtered = filtered.filter(item => {
                // Check equipment-level status
                if (item.status === filterStatus) return true;
                // Also check if any item has the selected status (for AVAILABLE/UNAVAILABLE/RENTED)
                if (item.items && item.items.some(i => i.status === filterStatus)) return true;
                return false;
            });
        }
        if (filterCategory) {
            filtered = filtered.filter(item => item.category.toLowerCase().includes(filterCategory.toLowerCase()));
        }
        if (searchName) {
            filtered = filtered.filter(item => item.name.toLowerCase().includes(searchName.toLowerCase()));
        }
        setFilteredEquipments(filtered);
    }, [equipments, filterStatus, filterCategory, searchName]);

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

    const handleItemStatusChange = async (itemId: string, newStatus: EquipmentItemStatus) => {
        try {
            setSaving(true);
            await apiClient.patch(`/equipments/items/${itemId}/status`, { status: newStatus });
            setSuccessMessage('Item status updated successfully!');
            fetchEquipments();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to update item status';
            setErrorMessage(message);
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

    const toggleExpand = (id: string) => {
        setExpandedEquipment(expandedEquipment === id ? null : id);
    };

    const getStatusBadge = (status: EquipmentItemStatus) => {
        switch (status) {
            case EquipmentItemStatus.AVAILABLE:
                return 'bg-green-100 text-green-700 border-green-300';
            case EquipmentItemStatus.UNAVAILABLE:
                return 'bg-red-100 text-red-700 border-red-300';
            case EquipmentItemStatus.RENTED:
                return 'bg-blue-100 text-blue-700 border-blue-300';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-300';
        }
    };

    const getAvailableCount = (items: EquipmentItem[] | undefined) => {
        if (!items) return 0;
        return items.filter(i => i.status === EquipmentItemStatus.AVAILABLE).length;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4">
            <div className="w-full max-w-6xl">
                {/* Success/Error Messages */}
                {successMessage && (
                    <div className="mb-6 flex gap-3 bg-green-50 border border-green-200 rounded-xl p-4 shadow-lg animate-fade-in">
                        <CheckCircle className="h-5 w-5 text-green-700 flex-shrink-0 mt-0.5" />
                        <p className="text-green-700 font-semibold">{successMessage}</p>
                    </div>
                )}

                {errorMessage && (
                    <div className="mb-6 flex gap-3 bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg animate-fade-in">
                        <AlertCircle className="h-5 w-5 text-red-700 flex-shrink-0 mt-0.5" />
                        <p className="text-red-700 font-semibold">{errorMessage}</p>
                    </div>
                )}

                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Manage Equipment</h1>
                    <button
                        onClick={openCreate}
                        disabled={saving}
                        className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-all duration-200 transform hover:scale-105"
                    >
                        <Plus className="h-5 w-5" />
                        Add New Equipment
                    </button>
                </div>

                {/* Filters */}
                {!loading && equipments.length > 0 && (
                    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-gray-300/40 shadow-lg p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Search Name</label>
                                <input
                                    type="text"
                                    value={searchName}
                                    onChange={(e) => setSearchName(e.target.value)}
                                    placeholder="Search by name..."
                                    className="w-full bg-white/70 border border-gray-300 rounded-lg text-gray-900 p-2 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Filter by Category</label>
                                <input
                                    type="text"
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    placeholder="Filter by category..."
                                    className="w-full bg-white/70 border border-gray-300 rounded-lg text-gray-900 p-2 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Filter by Status (Equipment or Item)</label>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-lg text-gray-900 p-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                >
                                    <option value="">All Status</option>
                                    <option value="AVAILABLE">✓ AVAILABLE</option>
                                    <option value="MAINTENANCE">⚙ MAINTENANCE</option>
                                    <option value="UNAVAILABLE">✗ UNAVAILABLE</option>
                                    <option value="RENTED">◉ RENTED</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-12 bg-white/70 backdrop-blur-md rounded-2xl border border-gray-300/40 shadow-lg">
                        <div className="text-gray-600">Loading equipments...</div>
                    </div>
                ) : equipments.length === 0 ? (
                    <div className="text-center py-12 bg-white/70 backdrop-blur-md rounded-2xl border border-gray-300/40 shadow-lg">
                        <div className="text-gray-600">No equipments found. Create one to get started!</div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredEquipments.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white/70 backdrop-blur-md rounded-2xl border border-gray-300/40 overflow-hidden shadow-lg transition-all duration-300 animate-fade-in"
                            >
                                {/* Main Row */}
                                <div className="flex items-center p-4 gap-4">
                                    {/* Image */}
                                    <div className="w-20 h-20 flex-shrink-0 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                                        {item.imageUrl ? (
                                            <img
                                                src={item.imageUrl}
                                                alt={item.name}
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=No+Image';
                                                }}
                                            />
                                        ) : (
                                            <div className="text-xs text-gray-500">No Image</div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 text-lg">{item.name}</h3>
                                        <p className="text-gray-600 text-sm">{item.category}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${item.status === 'AVAILABLE'
                                                ? 'bg-green-100 text-green-700 border-green-300'
                                                : 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                                }`}>
                                                {item.status}
                                            </span>
                                            <span className="text-sm text-gray-600">
                                                {getAvailableCount(item.items)}/{item.items?.length || 0} available
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleExpand(item.id)}
                                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            {expandedEquipment === item.id ? (
                                                <ChevronUp className="h-5 w-5" />
                                            ) : (
                                                <ChevronDown className="h-5 w-5" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => openEdit(item)}
                                            disabled={saving}
                                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            <Edit2 className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            disabled={saving}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Items */}
                                {expandedEquipment === item.id && item.items && item.items.length > 0 && (
                                    <div className="border-t border-gray-200 bg-gray-50/50 p-4 animate-slide-down">
                                        <h4 className="text-sm font-bold text-gray-700 mb-3">Individual Items</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                            {item.items.map((eqItem) => (
                                                <div
                                                    key={eqItem.id}
                                                    className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-bold text-gray-900">ID: {eqItem.itemCode}</span>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(eqItem.status as EquipmentItemStatus)}`}>
                                                            {eqItem.status}
                                                        </span>
                                                    </div>
                                                    <select
                                                        value={eqItem.status}
                                                        onChange={(e) => handleItemStatusChange(eqItem.id, e.target.value as EquipmentItemStatus)}
                                                        disabled={saving}
                                                        className="w-full text-sm bg-white border-2 border-gray-400 rounded p-2 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 cursor-pointer"
                                                    >
                                                        <option value="AVAILABLE" className="text-green-700 font-medium">✓ AVAILABLE</option>
                                                        <option value="UNAVAILABLE" className="text-red-700 font-medium">✗ UNAVAILABLE</option>
                                                        <option value="RENTED" className="text-blue-700 font-medium">◉ RENTED</option>
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {filteredEquipments.length === 0 && (
                            <div className="text-center py-12 bg-white/70 backdrop-blur-md rounded-2xl border border-gray-300/40 shadow-lg">
                                <p className="text-gray-600">No equipments match the filter criteria.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 backdrop-blur-md z-50">
                        <div className="bg-white/90 backdrop-blur-md rounded-2xl w-full max-w-md border border-gray-300/40 shadow-2xl p-6 animate-scale-in">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                {editingItem ? 'Edit Equipment' : 'Add New Equipment'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-700 mb-2 font-bold">Name *</label>
                                    <input
                                        type="text"
                                        required
                                        disabled={saving}
                                        className="w-full bg-white/70 border border-gray-300 rounded-lg text-gray-900 p-3 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-500 transition-all"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Equipment name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-700 mb-2 font-bold">Category *</label>
                                    <input
                                        type="text"
                                        required
                                        disabled={saving}
                                        className="w-full bg-white/70 border border-gray-300 rounded-lg text-gray-900 p-3 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-500 transition-all"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        placeholder="e.g., Camera, Microphone"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-2 font-bold">Stock Qty *</label>
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            disabled={saving || !!editingItem}
                                            className="w-full bg-white/70 border border-gray-300 rounded-lg text-gray-900 p-3 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all"
                                            value={formData.stockQty}
                                            onChange={e => setFormData({ ...formData, stockQty: parseInt(e.target.value) })}
                                        />
                                        {editingItem && (
                                            <p className="text-xs text-gray-500 mt-1">Cannot change after creation</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-2 font-bold">Status *</label>
                                        <select
                                            disabled={saving}
                                            className="w-full bg-white/70 border border-gray-300 rounded-lg text-gray-900 p-3 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all"
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="AVAILABLE">AVAILABLE</option>
                                            <option value="MAINTENANCE">MAINTENANCE</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-700 mb-2 font-bold">Image URL</label>
                                    <input
                                        type="url"
                                        disabled={saving}
                                        className="w-full bg-white/70 border border-gray-300 rounded-lg text-gray-900 p-3 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-500 transition-all"
                                        value={formData.imageUrl}
                                        onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                        placeholder="https://example.com/image.jpg"
                                    />
                                    {formData.imageUrl && (
                                        <div className="mt-3">
                                            <label className="block text-sm text-gray-700 mb-2 font-bold">Preview:</label>
                                            <div className="bg-white rounded-lg border border-gray-300 p-2 inline-block">
                                                <img
                                                    src={formData.imageUrl}
                                                    alt="Preview"
                                                    className="max-w-xs h-48 object-contain"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Invalid+Image+URL';
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        disabled={saving}
                                        className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 disabled:opacity-50 rounded-lg text-gray-900 font-bold transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 disabled:opacity-50 rounded-lg text-white font-bold shadow-lg transition-all duration-200 transform hover:scale-105"
                                    >
                                        {saving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
                @keyframes slide-down {
                    from { opacity: 0; max-height: 0; }
                    to { opacity: 1; max-height: 500px; }
                }
                .animate-slide-down {
                    animation: slide-down 0.3s ease-out forwards;
                }
                @keyframes scale-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-scale-in {
                    animation: scale-in 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
