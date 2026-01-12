import { useRef, useState, useEffect } from 'react';
import { X, Upload, Tag } from 'lucide-react';
import type { Equipment } from '../../types';

interface EquipmentFormModalProps {
    isOpen: boolean;
    editingItem: Equipment | null;
    categories: string[];
    saving: boolean;
    onClose: () => void;
    onSubmit: (data: { name: string; category: string; stockQty: number; status: string }, imageFile: File | null) => void;
    onManageCategories: () => void;
}

export default function EquipmentFormModal({ isOpen, editingItem, categories, saving, onClose, onSubmit, onManageCategories }: EquipmentFormModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({ name: '', category: '', stockQty: 1, status: 'AVAILABLE' });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');

    // Reset form when modal opens or editingItem changes
    useEffect(() => {
        if (isOpen) {
            setFormData({ name: editingItem?.name || '', category: editingItem?.category || '', stockQty: editingItem?.stockQty || 1, status: editingItem?.status || 'AVAILABLE' });
            setImagePreview(editingItem?.imageUrl || '');
            setImageFile(null);
        }
    }, [isOpen, editingItem]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData, imageFile);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="backdrop-blur-2xl bg-gradient-to-b from-slate-800/95 to-slate-900/95 rounded-3xl w-full max-w-md border border-white/20 shadow-2xl p-6 animate-scale-in">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">{editingItem ? 'แก้ไขอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่'}</h2>
                    <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all hover:rotate-90"><X className="h-5 w-5" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-white mb-2 font-semibold">ชื่ออุปกรณ์ *</label>
                        <input type="text" required disabled={saving} className="w-full backdrop-blur-xl bg-slate-800/60 border border-white/20 rounded-xl py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="เช่น Canon EOS R5" />
                    </div>

                    <div>
                        <label className="block text-sm text-white mb-2 font-semibold">หมวดหมู่ *</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <select required disabled={saving} className="w-full backdrop-blur-xl bg-slate-800/60 border border-white/20 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 cursor-pointer appearance-none" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={{ colorScheme: 'dark' }}>
                                    <option value="" className="bg-slate-800">เลือกหมวด...</option>
                                    {categories.map(cat => <option key={cat} value={cat} className="bg-slate-800">{cat}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"><svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                            </div>
                            <button type="button" onClick={onManageCategories} className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 flex items-center gap-2"><Tag className="w-4 h-4" /></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-white mb-2 font-semibold">จำนวน *</label>
                            <input type="number" min="1" required disabled={saving || !!editingItem} className="w-full backdrop-blur-xl bg-slate-800/60 border border-white/20 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50" value={formData.stockQty} onChange={e => setFormData({ ...formData, stockQty: parseInt(e.target.value) })} />
                            {editingItem && <p className="text-xs text-white/50 mt-1">เปลี่ยนทีหลังไม่ได้</p>}
                        </div>
                        <div>
                            <label className="block text-sm text-white mb-2 font-semibold">สถานะ *</label>
                            <div className="relative">
                                <select disabled={saving} className="w-full backdrop-blur-xl bg-slate-800/60 border border-white/20 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 cursor-pointer appearance-none" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} style={{ colorScheme: 'dark' }}>
                                    <option value="AVAILABLE" className="bg-slate-800">ว่าง</option>
                                    <option value="MAINTENANCE" className="bg-slate-800">ซ่อมบำรุง</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"><svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                            </div>
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm text-white mb-2 font-semibold">รูปอุปกรณ์</label>
                        <div onClick={() => fileInputRef.current?.click()} className="backdrop-blur-xl bg-slate-800/60 border-2 border-dashed border-white/30 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500/50 hover:bg-slate-700/50 transition-all">
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" disabled={saving} />
                            {imagePreview ? (
                                <div className="space-y-3">
                                    <div className="w-24 h-24 mx-auto bg-white rounded-xl overflow-hidden shadow-lg"><img src={imagePreview} alt="Preview" className="w-full h-full object-contain" /></div>
                                    <p className="text-sm text-white/60">แตะเพื่อเปลี่ยนรูป</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Upload className="h-10 w-10 mx-auto text-white/40" />
                                    <p className="text-white/60 text-sm">แตะเพื่ออัปโหลดรูป</p>
                                    <p className="text-white/40 text-xs">รองรับ JPG, PNG (ไม่เกิน 5MB)</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-6">
                        <button type="button" onClick={onClose} disabled={saving} className="flex-1 px-4 py-3 backdrop-blur-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-xl text-white font-medium border border-white/20">ยกเลิก</button>
                        <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50">{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
