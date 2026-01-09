import { useEffect, useState, useRef } from 'react';
import apiClient from '../api/client';
import type { Equipment, EquipmentItem } from '../types';
import { EquipmentItemStatus } from '../types';
import { AlertCircle, CheckCircle, Trash2, Edit2, Plus, ChevronDown, Settings, X, Upload, Package, AlertTriangle, Tag } from 'lucide-react';
import CategoryManager, { mergeWithEquipmentCategories } from '../components/CategoryManager';

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
    const [filterCategories, setFilterCategories] = useState<string[]>([]);
    const [searchName, setSearchName] = useState('');
    const [expandedEquipment, setExpandedEquipment] = useState<string | null>(null);

    // Category management state
    const [categories, setCategories] = useState<string[]>([]);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);

    // Confirmation modal state
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ type: string; id?: string; name?: string } | null>(null);

    // Image upload state
    const [uploadingImage, setUploadingImage] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        stockQty: 1,
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

            // Extract and merge categories from equipment
            const equipmentCategories = [...new Set(response.data.map(e => e.category).filter(Boolean))];
            const mergedCategories = mergeWithEquipmentCategories(equipmentCategories);
            setCategories(mergedCategories);
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
            filtered = filtered.filter(item => {
                if (item.status === filterStatus) return true;
                if (item.items && item.items.some(i => i.status === filterStatus)) return true;
                return false;
            });
        }
        if (filterCategories.length > 0) {
            filtered = filtered.filter(item => filterCategories.includes(item.category));
        }
        if (searchName) {
            filtered = filtered.filter(item => item.name.toLowerCase().includes(searchName.toLowerCase()));
        }
        setFilteredEquipments(filtered);
    }, [equipments, filterStatus, filterCategories, searchName]);

    // Confirmation handlers
    const showConfirmation = (type: string, id?: string, name?: string) => {
        setConfirmAction({ type, id, name });
        setShowConfirmModal(true);
    };

    const handleConfirmedAction = async () => {
        if (!confirmAction) return;

        if (confirmAction.type === 'delete' && confirmAction.id) {
            await executeDelete(confirmAction.id);
        }

        setShowConfirmModal(false);
        setConfirmAction(null);
    };

    const executeDelete = async (id: string) => {
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

            let equipment;
            if (editingItem) {
                equipment = await apiClient.patch(`/equipments/${editingItem.id}`, formData);
                setSuccessMessage('Equipment updated successfully!');
            } else {
                equipment = await apiClient.post('/equipments', formData);
                setSuccessMessage('Equipment added successfully!');
            }

            // Upload image if selected
            if (imageFile && equipment.data?.id) {
                await uploadImage(equipment.data.id);
            }

            setIsModalOpen(false);
            setEditingItem(null);
            setFormData({ name: '', category: '', stockQty: 1, status: 'AVAILABLE' });
            setImageFile(null);
            setImagePreview('');
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

    const uploadImage = async (equipmentId: string) => {
        if (!imageFile) return;

        const formData = new FormData();
        formData.append('image', imageFile);

        try {
            setUploadingImage(equipmentId);
            await apiClient.post(`/equipments/${equipmentId}/upload-image`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        } catch (err: any) {
            console.error('Failed to upload image', err);
            throw err;
        } finally {
            setUploadingImage(null);
        }
    };

    const handleImageUpload = async (equipmentId: string, file: File) => {
        const formData = new FormData();
        formData.append('image', file);

        try {
            setUploadingImage(equipmentId);
            await apiClient.post(`/equipments/${equipmentId}/upload-image`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSuccessMessage('Image uploaded successfully!');
            fetchEquipments();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to upload image';
            setErrorMessage(message);
        } finally {
            setUploadingImage(null);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const executeStatusChange = async (itemId: string, newStatus: EquipmentItemStatus) => {
        try {
            setSaving(true);
            await apiClient.patch(`/equipments/items/${itemId}/status`, { status: newStatus });
            setSuccessMessage('Status updated successfully!');
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
            status: item.status
        });
        setImageFile(null);
        setImagePreview(item.imageUrl || '');
        setIsModalOpen(true);
    };

    const openCreate = () => {
        setEditingItem(null);
        setFormData({ name: '', category: '', stockQty: 1, status: 'AVAILABLE' });
        setImageFile(null);
        setImagePreview('');
        setIsModalOpen(true);
    };

    const toggleExpand = (id: string) => {
        setExpandedEquipment(expandedEquipment === id ? null : id);
    };

    const getStatusBadge = (status: EquipmentItemStatus) => {
        switch (status) {
            case EquipmentItemStatus.AVAILABLE:
                return 'bg-green-600 text-white';
            case EquipmentItemStatus.UNAVAILABLE:
                return 'bg-red-600 text-white';
            case EquipmentItemStatus.RENTED:
                return 'bg-blue-600 text-white';
            default:
                return 'bg-gray-600 text-white';
        }
    };

    const getAvailableCount = (items: EquipmentItem[] | undefined) => {
        if (!items) return 0;
        return items.filter(i => i.status === EquipmentItemStatus.AVAILABLE).length;
    };

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
            {/* Success/Error Messages */}
            {successMessage && (
                <div className="mb-6 flex gap-3 backdrop-blur-2xl bg-green-900/50 border border-green-500/30 rounded-xl p-4 shadow-lg animate-fade-in">
                    <CheckCircle className="h-5 w-5 text-green-300 flex-shrink-0 mt-0.5" />
                    <p className="text-green-200 font-semibold">{successMessage}</p>
                </div>
            )}

            {errorMessage && (
                <div className="mb-6 flex gap-3 backdrop-blur-2xl bg-red-900/50 border border-red-500/30 rounded-xl p-4 shadow-lg animate-fade-in">
                    <AlertCircle className="h-5 w-5 text-red-300 flex-shrink-0 mt-0.5" />
                    <p className="text-red-200 font-semibold">{errorMessage}</p>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <Settings className="w-8 h-8 text-white" />
                    <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>
                        Manage Equipment
                    </h1>
                </div>
                <button
                    onClick={openCreate}
                    disabled={saving}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed self-start md:self-auto"
                >
                    <Plus className="h-5 w-5" />
                    Add New Equipment
                </button>
            </div>

            {/* Filters */}
            {!loading && equipments.length > 0 && (
                <div className="relative z-20 backdrop-blur-2xl bg-slate-900/60 rounded-2xl border border-white/20 shadow-xl p-4 md:p-6 mb-8 transition-all duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="group">
                            <label className="block text-sm font-semibold text-white mb-2">Search Name</label>
                            <input
                                type="text"
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                placeholder="Type equipment name..."
                                className="w-full backdrop-blur-xl bg-slate-800/60 border border-white/20 rounded-xl py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                            />
                        </div>
                        <div className="group">
                            <label className="block text-sm font-semibold text-white mb-2">Filter by Category</label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                    className="w-full backdrop-blur-xl bg-slate-800/60 border border-white/20 rounded-xl py-3 px-4 text-left text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 cursor-pointer flex items-center justify-between"
                                >
                                    <span className={filterCategories.length > 0 ? 'text-white' : 'text-white/40'}>
                                        {filterCategories.length > 0 ? `${filterCategories.length} selected` : 'All Categories'}
                                    </span>
                                    <svg className={`w-4 h-4 text-white/60 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {showCategoryDropdown && (
                                    <div className="absolute z-[100] w-full mt-2 backdrop-blur-2xl bg-slate-800/95 border border-white/20 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                                        {categories.length === 0 ? (
                                            <div className="p-4 text-center text-white/50 text-sm">No categories available</div>
                                        ) : (
                                            <>
                                                {filterCategories.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setFilterCategories([])}
                                                        className="w-full p-3 text-left text-sm text-blue-400 hover:bg-white/10 border-b border-white/10"
                                                    >
                                                        Clear all
                                                    </button>
                                                )}
                                                {categories.map(cat => (
                                                    <label key={cat} className="flex items-center gap-3 p-3 hover:bg-white/10 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={filterCategories.includes(cat)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setFilterCategories([...filterCategories, cat]);
                                                                } else {
                                                                    setFilterCategories(filterCategories.filter(c => c !== cat));
                                                                }
                                                            }}
                                                            className="w-4 h-4 rounded border-white/30 bg-slate-700 text-blue-500 focus:ring-blue-500/50"
                                                        />
                                                        <span className="text-white text-sm">{cat}</span>
                                                    </label>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="group">
                            <label className="block text-sm font-semibold text-white mb-2">Filter by Status</label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                    className="w-full backdrop-blur-xl bg-slate-800/60 border border-white/20 rounded-xl py-3 px-4 text-left text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 cursor-pointer flex items-center justify-between"
                                >
                                    <span className={filterStatus ? 'text-white' : 'text-white/40'}>
                                        {filterStatus ? (filterStatus === 'AVAILABLE' ? '✓ Available' : filterStatus === 'MAINTENANCE' ? '⚙ Maintenance' : filterStatus === 'UNAVAILABLE' ? '✗ Unavailable' : '◉ Rented') : 'All Statuses'}
                                    </span>
                                    <svg className={`w-4 h-4 text-white/60 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {showStatusDropdown && (
                                    <div className="absolute z-[100] w-full mt-2 backdrop-blur-2xl bg-slate-800/95 border border-white/20 rounded-xl shadow-2xl overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => { setFilterStatus(''); setShowStatusDropdown(false); }}
                                            className={`w-full p-3 text-left text-sm hover:bg-white/10 ${!filterStatus ? 'bg-blue-500/20 text-white' : 'text-white/70'}`}
                                        >
                                            All Statuses
                                        </button>
                                        {[
                                            { value: 'AVAILABLE', label: '✓ Available' },
                                            { value: 'MAINTENANCE', label: '⚙ Maintenance' },
                                            { value: 'UNAVAILABLE', label: '✗ Unavailable' },
                                            { value: 'RENTED', label: '◉ Rented' },
                                        ].map(status => (
                                            <button
                                                key={status.value}
                                                type="button"
                                                onClick={() => { setFilterStatus(status.value); setShowStatusDropdown(false); }}
                                                className={`w-full p-3 text-left text-sm hover:bg-white/10 ${filterStatus === status.value ? 'bg-blue-500/20 text-white' : 'text-white/70'}`}
                                            >
                                                {status.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl border border-white/20 p-12 text-center shadow-xl">
                    <div className="flex items-center justify-center gap-3">
                        <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-white font-medium">Loading...</span>
                    </div>
                </div>
            ) : equipments.length === 0 ? (
                <div className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl border border-white/20 p-12 text-center shadow-xl">
                    <Package className="w-16 h-16 mx-auto mb-4 text-white/30" />
                    <p className="text-white/70">No equipment found. Start by adding new equipment!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredEquipments.map((item, index) => (
                        <div
                            key={item.id}
                            className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl border border-white/20 overflow-hidden shadow-xl transition-all duration-300 animate-fade-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {/* Main Row */}
                            <div className="flex items-center p-4 gap-4">
                                {/* Image with white background and upload option */}
                                <div className="relative w-20 h-20 flex-shrink-0 group">
                                    <div className="w-full h-full bg-white rounded-xl border border-white/20 flex items-center justify-center overflow-hidden shadow-lg">
                                        {item.imageUrl ? (
                                            <img
                                                src={item.imageUrl}
                                                alt={item.name}
                                                className="w-full h-full object-contain p-1"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/f8f8f8/cccccc?text=No+Image';
                                                }}
                                            />
                                        ) : (
                                            <Package className="w-8 h-8 text-gray-400" />
                                        )}
                                    </div>
                                    {/* Upload overlay */}
                                    <label className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleImageUpload(item.id, file);
                                            }}
                                            disabled={uploadingImage === item.id}
                                        />
                                        {uploadingImage === item.id ? (
                                            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                        ) : (
                                            <Upload className="h-5 w-5 text-white" />
                                        )}
                                    </label>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white text-lg">{item.name}</h3>
                                    <p className="text-white/70 text-sm">{item.category}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all duration-200 ${item.status === 'AVAILABLE'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-yellow-600 text-white'
                                            }`}>
                                            {item.status === 'AVAILABLE' ? 'Available' : item.status}
                                        </span>
                                        <span className="text-sm text-white/70">
                                            {getAvailableCount(item.items)}/{item.items?.length || 0} available
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleExpand(item.id)}
                                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                                    >
                                        <div className={`transform transition-transform duration-300 ${expandedEquipment === item.id ? 'rotate-180' : ''}`}>
                                            <ChevronDown className="h-5 w-5" />
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => openEdit(item)}
                                        disabled={saving}
                                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 disabled:opacity-50"
                                    >
                                        <Edit2 className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => showConfirmation('delete', item.id, item.name)}
                                        disabled={saving}
                                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/50 rounded-xl transition-all duration-200 disabled:opacity-50"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Items */}
                            <div className={`overflow-hidden transition-all duration-300 ${expandedEquipment === item.id ? 'max-h-96' : 'max-h-0'}`}>
                                {item.items && item.items.length > 0 && (
                                    <div className="border-t border-white/10 backdrop-blur-xl bg-slate-800/40 p-4">
                                        <h4 className="text-sm font-bold text-white mb-3">Individual Items</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                            {item.items.map((eqItem) => (
                                                <div
                                                    key={eqItem.id}
                                                    className="backdrop-blur-2xl bg-slate-700/50 rounded-xl p-3 border border-white/10 transition-all duration-200 hover:bg-slate-600/50"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-bold text-white text-sm">ID: {eqItem.itemCode}</span>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(eqItem.status as EquipmentItemStatus)}`}>
                                                            {eqItem.status}
                                                        </span>
                                                    </div>
                                                    <div className="relative">
                                                        <select
                                                            value={eqItem.status}
                                                            onChange={(e) => {
                                                                const newStatus = e.target.value as EquipmentItemStatus;
                                                                setConfirmAction({ type: 'statusChange', id: `${eqItem.id}:${newStatus}`, name: `Item ${eqItem.itemCode} to ${newStatus}` });
                                                                setShowConfirmModal(true);
                                                            }}
                                                            disabled={saving}
                                                            className="w-full text-sm backdrop-blur-xl bg-slate-800/60 border border-white/20 rounded-lg p-2 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 cursor-pointer appearance-none transition-all duration-200"
                                                            style={{ colorScheme: 'dark' }}
                                                        >
                                                            <option value="AVAILABLE" className="bg-slate-800">✓ Available</option>
                                                            <option value="UNAVAILABLE" className="bg-slate-800">✗ Unavailable</option>
                                                            <option value="RENTED" className="bg-slate-800">◉ Rented</option>
                                                        </select>
                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                                            <svg className="w-3 h-3 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {filteredEquipments.length === 0 && (
                        <div className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl border border-white/20 p-12 text-center shadow-xl">
                            <p className="text-white/70">No equipment matches the filter criteria.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="backdrop-blur-2xl bg-gradient-to-b from-slate-800/95 to-slate-900/95 rounded-3xl w-full max-w-md border border-white/20 shadow-2xl p-6 animate-scale-in">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">
                                {editingItem ? 'Edit Equipment' : 'Add New Equipment'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 hover:rotate-90"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-white mb-2 font-semibold">Equipment Name *</label>
                                <input
                                    type="text"
                                    required
                                    disabled={saving}
                                    className="w-full backdrop-blur-xl bg-slate-800/60 border border-white/20 rounded-xl py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 disabled:opacity-50"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Canon EOS R5"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-white mb-2 font-semibold">Category *</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <select
                                            required
                                            disabled={saving}
                                            className="w-full backdrop-blur-xl bg-slate-800/60 border border-white/20 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 disabled:opacity-50 cursor-pointer appearance-none"
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            style={{ colorScheme: 'dark' }}
                                        >
                                            <option value="" className="bg-slate-800">Select category...</option>
                                            {categories.map(cat => (
                                                <option key={cat} value={cat} className="bg-slate-800">{cat}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowCategoryManager(true)}
                                        className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200 border border-white/20 flex items-center gap-2"
                                        title="Manage Categories"
                                    >
                                        <Tag className="w-4 h-4" />
                                    </button>
                                </div>
                                {categories.length === 0 && (
                                    <p className="text-amber-400/80 text-xs mt-2">No categories yet. Click the tag icon to add categories.</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-white mb-2 font-semibold">Quantity *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        disabled={saving || !!editingItem}
                                        className="w-full backdrop-blur-xl bg-slate-800/60 border border-white/20 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 disabled:opacity-50"
                                        value={formData.stockQty}
                                        onChange={e => setFormData({ ...formData, stockQty: parseInt(e.target.value) })}
                                    />
                                    {editingItem && (
                                        <p className="text-xs text-white/50 mt-1">Cannot be changed after creation</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm text-white mb-2 font-semibold">Status *</label>
                                    <div className="relative">
                                        <select
                                            disabled={saving}
                                            className="w-full backdrop-blur-xl bg-slate-800/60 border border-white/20 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 disabled:opacity-50 cursor-pointer appearance-none"
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                            style={{ colorScheme: 'dark' }}
                                        >
                                            <option value="AVAILABLE" className="bg-slate-800">Available</option>
                                            <option value="MAINTENANCE" className="bg-slate-800">Maintenance</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm text-white mb-2 font-semibold">
                                    Equipment Image
                                </label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="backdrop-blur-xl bg-slate-800/60 border-2 border-dashed border-white/30 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500/50 hover:bg-slate-700/50 transition-all duration-300"
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        disabled={saving}
                                    />
                                    {imagePreview ? (
                                        <div className="space-y-3">
                                            <div className="w-24 h-24 mx-auto bg-white rounded-xl overflow-hidden shadow-lg">
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                            <p className="text-sm text-white/60">Click to change image</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Upload className="h-10 w-10 mx-auto text-white/40" />
                                            <p className="text-white/60 text-sm">Click to upload image</p>
                                            <p className="text-white/40 text-xs">JPG, PNG, GIF, WebP (max 5MB)</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={saving}
                                    className="flex-1 px-4 py-3 backdrop-blur-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-xl text-white font-medium transition-all duration-200 border border-white/20"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && confirmAction && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in" onClick={() => setShowConfirmModal(false)} />
                    <div className="relative backdrop-blur-2xl bg-gradient-to-b from-slate-800/95 to-slate-900/95 rounded-3xl shadow-2xl max-w-sm w-full mx-4 p-6 animate-scale-in border border-white/20">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                                <AlertTriangle className="h-8 w-8 text-amber-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Confirm Action</h3>
                            <p className="text-white/60">
                                {confirmAction.type === 'delete'
                                    ? `Are you sure you want to delete "${confirmAction.name}"?`
                                    : `Are you sure you want to change ${confirmAction.name}?`}
                            </p>
                            {confirmAction.type === 'delete' && (
                                <p className="text-red-400 text-sm mt-2">This action cannot be undone.</p>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-white/10 hover:bg-white/20 transition-all duration-200 border border-white/20"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if (confirmAction.type === 'delete') {
                                        await handleConfirmedAction();
                                    } else if (confirmAction.type === 'statusChange' && confirmAction.id) {
                                        const [itemId, newStatus] = confirmAction.id.split(':');
                                        await executeStatusChange(itemId, newStatus as EquipmentItemStatus);
                                        setShowConfirmModal(false);
                                        setConfirmAction(null);
                                    }
                                }}
                                className={`flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all duration-200 shadow-lg ${confirmAction.type === 'delete'
                                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                                    }`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Manager Modal */}
            <CategoryManager
                isOpen={showCategoryManager}
                onClose={() => setShowCategoryManager(false)}
                categories={categories}
                onCategoriesChange={setCategories}
            />

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    opacity: 0;
                    animation: fade-in 0.4s ease-out forwards;
                }
                @keyframes scale-in {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-scale-in {
                    animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
}
