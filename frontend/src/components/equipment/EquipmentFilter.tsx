import { Search, Tag } from 'lucide-react';
import { useState } from 'react';

interface EquipmentFilterProps {
    searchName: string;
    setSearchName: (value: string) => void;
    filterCategories: string[];
    setFilterCategories: (value: string[]) => void;
    categories: string[];
}

export default function EquipmentFilter({
    searchName, setSearchName, filterCategories, setFilterCategories, categories
}: EquipmentFilterProps) {
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    return (
        <div className="relative z-20 backdrop-blur-2xl bg-slate-900/60 rounded-2xl border border-white/20 shadow-xl p-4 md:p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search Input */}
                <div className="group">
                    <label className="block text-sm font-semibold text-white mb-2">
                        <Search className="inline w-4 h-4 mr-1" />ค้นหา
                    </label>
                    <input
                        type="text"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        placeholder="พิมพ์ชื่ออุปกรณ์..."
                        className="w-full backdrop-blur-xl bg-slate-800/60 border border-white/20 rounded-xl py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>

                {/* Category Filter Dropdown */}
                <div className="group">
                    <label className="block text-sm font-semibold text-white mb-2">
                        <Tag className="inline w-4 h-4 mr-1" />หมวดหมู่
                    </label>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                            className="w-full backdrop-blur-xl bg-slate-800/60 border border-white/20 rounded-xl py-3 px-4 text-left text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 flex items-center justify-between"
                        >
                            <span className={filterCategories.length > 0 ? 'text-white' : 'text-white/40'}>
                                {filterCategories.length > 0 ? `เลือก ${filterCategories.length} หมวด` : 'ทุกหมวด'}
                            </span>
                            <svg className={`w-4 h-4 text-white/60 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {showCategoryDropdown && (
                            <div className="absolute z-[100] w-full mt-2 backdrop-blur-2xl bg-slate-800/95 border border-white/20 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                                {filterCategories.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setFilterCategories([])}
                                        className="w-full p-3 text-left text-sm text-blue-400 hover:bg-white/10 border-b border-white/10"
                                    >
                                        ล้าง
                                    </button>
                                )}
                                {categories.map(cat => (
                                    <label key={cat} className="flex items-center gap-3 p-3 hover:bg-white/10 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filterCategories.includes(cat)}
                                            onChange={(e) => e.target.checked ? setFilterCategories([...filterCategories, cat]) : setFilterCategories(filterCategories.filter(c => c !== cat))}
                                            className="w-4 h-4 rounded"
                                        />
                                        <span className="text-white text-sm">{cat}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
