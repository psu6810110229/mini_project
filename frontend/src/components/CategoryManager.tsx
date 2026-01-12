import { useState } from 'react';
import { X, Plus, Tag, Trash2, AlertTriangle } from 'lucide-react';

interface CategoryManagerProps {
    isOpen: boolean;
    onClose: () => void;
    categories: string[];
    onCategoriesChange: (categories: string[]) => void;
}

const STORAGE_KEY = 'equipment_categories';

// Get categories from localStorage
export const getStoredCategories = (): string[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

// Save categories to localStorage
export const saveCategories = (categories: string[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
};

// Merge with existing equipment categories
export const mergeWithEquipmentCategories = (equipmentCategories: string[]): string[] => {
    const stored = getStoredCategories();
    const merged = [...new Set([...stored, ...equipmentCategories])];
    const sorted = merged.filter(Boolean).sort((a, b) => a.localeCompare(b));
    saveCategories(sorted);
    return sorted;
};

export default function CategoryManager({ isOpen, onClose, categories, onCategoriesChange }: CategoryManagerProps) {
    const [newCategory, setNewCategory] = useState('');
    const [error, setError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    const handleAddCategory = () => {
        const trimmed = newCategory.trim();
        if (!trimmed) {
            setError('กรอกชื่อหมวดก่อน');
        }

        // Check for duplicates (case-insensitive)
        if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
            setError('มีหมวดนี้อยู่แล้ว');
        }

        const updated = [...categories, trimmed].sort((a, b) => a.localeCompare(b));
        onCategoriesChange(updated);
        saveCategories(updated);
        setNewCategory('');
        setError('');
    };

    const handleDeleteCategory = (category: string) => {
        const updated = categories.filter(c => c !== category);
        onCategoriesChange(updated);
        saveCategories(updated);
        setShowDeleteConfirm(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in" onClick={onClose} />
            <div className="relative backdrop-blur-2xl bg-gradient-to-b from-slate-800/95 to-slate-900/95 rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in border border-white/20">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <Tag className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">จัดการหมวดหมู่</h2>
                            <p className="text-sm text-white/50">มี {categories.length} หมวด</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Add new category */}
                <div className="p-6 border-b border-white/10">
                    <label className="block text-sm font-semibold text-white mb-2">เพิ่มหมวดใหม่</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newCategory}
                            onChange={(e) => {
                                setNewCategory(e.target.value);
                                setError('');
                            }}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                            placeholder="เช่น Camera, Lens..."
                            className="flex-1 backdrop-blur-xl bg-slate-800/60 border border-white/20 rounded-xl py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                        <button
                            onClick={handleAddCategory}
                            className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            เพิ่ม
                        </button>
                    </div>
                    {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
                </div>

                {/* Category list */}
                <div className="max-h-64 overflow-y-auto p-6">
                    {categories.length === 0 ? (
                        <div className="text-center py-8">
                            <Tag className="w-12 h-12 mx-auto mb-3 text-white/30" />
                            <p className="text-white/50">ยังไม่มีหมวด</p>
                            <p className="text-white/30 text-sm">เพิ่มหมวดแรกได้เลย</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {categories.map((category) => (
                                <div
                                    key={category}
                                    className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200"
                                >
                                    <div className="flex items-center gap-2">
                                        <Tag className="w-4 h-4 text-blue-400" />
                                        <span className="text-white font-medium">{category}</span>
                                    </div>
                                    <button
                                        onClick={() => setShowDeleteConfirm(category)}
                                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition-all duration-200"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all duration-200 border border-white/20"
                    >
                        เสร็จ
                    </button>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-slate-800 rounded-2xl p-6 max-w-xs w-full mx-4 border border-white/20 shadow-2xl">
                            <div className="text-center mb-4">
                                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-500/20 flex items-center justify-center">
                                    <AlertTriangle className="w-6 h-6 text-red-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">ลบหมวดนี้?</h3>
                                <p className="text-white/60 text-sm">
                                    ลบ "<span className="text-white font-medium">{showDeleteConfirm}</span>" หรือไม่?
                                </p>
                                <p className="text-amber-400/80 text-xs mt-2">อุปกรณ์ที่มีอยู่จะยังคงหมวดนี้</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="flex-1 px-3 py-2 rounded-xl text-white bg-white/10 hover:bg-white/20 transition-all"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={() => handleDeleteCategory(showDeleteConfirm)}
                                    className="flex-1 px-3 py-2 rounded-xl text-white bg-red-500 hover:bg-red-600 transition-all font-medium"
                                >
                                    ลบ
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
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
