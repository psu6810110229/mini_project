import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import type { Equipment } from '../types';
import { EquipmentItemStatus } from '../types';
import { AlertCircle, CheckCircle, Plus, Settings, Package, AlertTriangle } from 'lucide-react';
import CategoryManager, { mergeWithEquipmentCategories } from '../components/CategoryManager';
import EquipmentRow from '../components/equipment/EquipmentRow';
import EquipmentFormModal from '../components/equipment/EquipmentFormModal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import SearchBar from '../components/ui/SearchBar';

export default function AdminEquipments() {
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Equipment | null>(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [filterCategories, setFilterCategories] = useState<string[]>([]);
    const [searchName, setSearchName] = useState('');
    const [expandedEquipment, setExpandedEquipment] = useState<string | null>(null);
    const [categories, setCategories] = useState<string[]>([]);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ type: string; id?: string; name?: string } | null>(null);
    const [uploadingImage, setUploadingImage] = useState<string | null>(null);

    useEffect(() => { fetchEquipments(); }, []);

    const fetchEquipments = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get<Equipment[]>('/equipments');
            setEquipments(response.data);
            setFilteredEquipments(response.data);
            const equipmentCategories = [...new Set(response.data.map(e => e.category).filter(Boolean))];
            setCategories(mergeWithEquipmentCategories(equipmentCategories));
        } catch { setErrorMessage('โหลดอุปกรณ์ไม่สำเร็จ'); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        let filtered = [...equipments];
        // Apply category and search filters
        if (filterCategories.length > 0) filtered = filtered.filter(item => filterCategories.includes(item.category));
        if (searchName) filtered = filtered.filter(item => item.name.toLowerCase().includes(searchName.toLowerCase()));
        setFilteredEquipments(filtered);
    }, [equipments, filterCategories, searchName]);

    const showSuccess = (msg: string) => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(''), 3000); };
    const showError = (msg: string) => { setErrorMessage(msg); setTimeout(() => setErrorMessage(''), 5000); };

    const handleDelete = async (id: string) => {
        try { setSaving(true); await apiClient.delete(`/equipments/${id}`); showSuccess('ลบแล้ว!'); fetchEquipments(); }
        catch (err: any) { showError(err.response?.data?.message || 'ลบไม่สำเร็จ'); }
        finally { setSaving(false); }
    };

    const handleSubmit = async (data: { name: string; category: string; stockQty: number; status: string }, imageFile: File | null) => {
        try {
            setSaving(true);
            let equipment;
            if (editingItem) { equipment = await apiClient.patch(`/equipments/${editingItem.id}`, data); showSuccess('บันทึกแล้ว!'); }
            else { equipment = await apiClient.post('/equipments', data); showSuccess('เพิ่มอุปกรณ์แล้ว!'); }
            if (imageFile && equipment.data?.id) await handleImageUpload(equipment.data.id, imageFile);
            setIsModalOpen(false); setEditingItem(null); fetchEquipments();
        } catch (err: any) { showError(err.response?.data?.message || 'บันทึกไม่สำเร็จ'); }
        finally { setSaving(false); }
    };

    const handleImageUpload = async (equipmentId: string, file: File) => {
        const formData = new FormData();
        formData.append('image', file);
        try {
            setUploadingImage(equipmentId);
            await apiClient.post(`/equipments/${equipmentId}/upload-image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            showSuccess('อัปโหลดรูปแล้ว!'); fetchEquipments();
        } catch (err: any) { showError(err.response?.data?.message || 'อัปโหลดรูปไม่สำเร็จ'); }
        finally { setUploadingImage(null); }
    };

    const handleStatusChange = async (itemId: string, newStatus: EquipmentItemStatus) => {
        try { setSaving(true); await apiClient.patch(`/equipments/items/${itemId}/status`, { status: newStatus }); showSuccess('อัปเดตสถานะแล้ว!'); fetchEquipments(); }
        catch (err: any) { showError(err.response?.data?.message || 'อัปเดตสถานะไม่สำเร็จ'); }
        finally { setSaving(false); }
    };

    const showConfirmation = (type: string, id?: string, name?: string) => { setConfirmAction({ type, id, name }); setShowConfirmModal(true); };

    if (loading) return <LoadingSpinner message="กำลังโหลด..." />;

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
            {successMessage && <div className="mb-6 flex gap-3 backdrop-blur-2xl bg-green-900/50 border border-green-500/30 rounded-xl p-4 shadow-lg animate-fade-in"><CheckCircle className="h-5 w-5 text-green-300" /><p className="text-green-200 font-semibold">{successMessage}</p></div>}
            {errorMessage && <div className="mb-6 flex gap-3 backdrop-blur-2xl bg-red-900/50 border border-red-500/30 rounded-xl p-4 shadow-lg animate-fade-in"><AlertCircle className="h-5 w-5 text-red-300" /><p className="text-red-200 font-semibold">{errorMessage}</p></div>}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3"><Settings className="w-8 h-8 text-white" /><h1 className="text-3xl md:text-4xl font-bold text-white" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>จัดการอุปกรณ์</h1></div>
                <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} disabled={saving} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg transition-all disabled:opacity-50"><Plus className="h-5 w-5" /> + เพิ่มอุปกรณ์</button>
            </div>

            {equipments.length > 0 && (
                <div className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl border border-white/20 shadow-xl p-4 md:p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-semibold text-white mb-2">ค้นหา</label><SearchBar value={searchName} onChange={setSearchName} placeholder="พิมพ์ชื่อ..." /></div>
                        <div>
                            <label className="block text-sm font-semibold text-white mb-2">หมวดหมู่</label>
                            <select value={filterCategories[0] || ''} onChange={e => setFilterCategories(e.target.value ? [e.target.value] : [])} className="w-full backdrop-blur-xl bg-slate-800/60 border border-white/20 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" style={{ colorScheme: 'dark' }}>
                                <option value="">ทุกหมวด</option>
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {equipments.length === 0 ? <EmptyState icon={Package} message="ยังไม่มีอุปกรณ์ กดเพิ่มได้เลย!" /> : (
                <div className="space-y-4">
                    {filteredEquipments.map(item => (
                        <EquipmentRow key={item.id} item={item} isExpanded={expandedEquipment === item.id} saving={saving} uploadingImage={uploadingImage}
                            onToggleExpand={() => setExpandedEquipment(expandedEquipment === item.id ? null : item.id)}
                            onEdit={() => { setEditingItem(item); setIsModalOpen(true); }}
                            onDelete={() => showConfirmation('delete', item.id, item.name)}
                            onImageUpload={(file) => handleImageUpload(item.id, file)}
                            onStatusChange={(itemId, newStatus, itemCode) => showConfirmation('statusChange', `${itemId}:${newStatus}`, `Item ${itemCode} to ${newStatus}`)} />
                    ))}
                    {filteredEquipments.length === 0 && <EmptyState icon={Package} message="ไม่พบอุปกรณ์ตามตัวกรอง" />}
                </div>
            )}

            <EquipmentFormModal isOpen={isModalOpen} editingItem={editingItem} categories={categories} saving={saving} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} onManageCategories={() => setShowCategoryManager(true)} />

            {showConfirmModal && confirmAction && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowConfirmModal(false)} />
                    <div className="relative backdrop-blur-2xl bg-gradient-to-b from-slate-800/95 to-slate-900/95 rounded-3xl shadow-2xl max-w-sm w-full mx-4 p-6 animate-scale-in border border-white/20">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center"><AlertTriangle className="h-8 w-8 text-amber-400" /></div>
                            <h3 className="text-xl font-bold text-white mb-2">ยืนยัน</h3>
                            <p className="text-white/60">{confirmAction.type === 'delete' ? `ลบ "${confirmAction.name}" จริงหรือ?` : `เปลี่ยน ${confirmAction.name}?`}</p>
                            {confirmAction.type === 'delete' && <p className="text-red-400 text-sm mt-2">ลบแล้วกู้คืนไม่ได้นะ</p>}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowConfirmModal(false)} className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20">ยกเลิก</button>
                            <button onClick={async () => {
                                if (confirmAction.type === 'delete' && confirmAction.id) await handleDelete(confirmAction.id);
                                else if (confirmAction.type === 'statusChange' && confirmAction.id) { const [itemId, newStatus] = confirmAction.id.split(':'); await handleStatusChange(itemId, newStatus as EquipmentItemStatus); }
                                setShowConfirmModal(false); setConfirmAction(null);
                            }} className={`flex-1 px-4 py-3 rounded-xl font-bold text-white shadow-lg ${confirmAction.type === 'delete' ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'}`}>ยืนยัน</button>
                        </div>
                    </div>
                </div>
            )}

            <CategoryManager isOpen={showCategoryManager} onClose={() => setShowCategoryManager(false)} categories={categories} onCategoriesChange={setCategories} />
        </div>
    );
}
