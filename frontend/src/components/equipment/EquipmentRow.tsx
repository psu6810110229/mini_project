import { ChevronDown, Edit2, Trash2, Upload, Package } from 'lucide-react';
import type { Equipment, EquipmentItem } from '../../types';
import { EquipmentItemStatus } from '../../types';

interface EquipmentRowProps {
    item: Equipment;
    isExpanded: boolean;
    saving: boolean;
    uploadingImage: string | null;
    onToggleExpand: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onImageUpload: (file: File) => void;
    onStatusChange: (itemId: string, newStatus: EquipmentItemStatus, itemCode: string) => void;
}

const getStatusBadge = (status: EquipmentItemStatus) => {
    const badges: Record<string, string> = {
        AVAILABLE: 'bg-green-600 text-white',
        UNAVAILABLE: 'bg-red-600 text-white',
        RENTED: 'bg-blue-600 text-white',
    };
    return badges[status] || 'bg-gray-600 text-white';
};

const getAvailableCount = (items: EquipmentItem[] | undefined) =>
    items?.filter(i => i.status === EquipmentItemStatus.AVAILABLE).length || 0;

export default function EquipmentRow({ item, isExpanded, saving, uploadingImage, onToggleExpand, onEdit, onDelete, onImageUpload, onStatusChange }: EquipmentRowProps) {
    return (
        <div className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl border border-white/20 overflow-hidden shadow-xl transition-all duration-300 animate-fade-in">
            <div className="flex items-center p-4 gap-4">
                {/* Image */}
                <div className="relative w-20 h-20 flex-shrink-0 group">
                    <div className="w-full h-full bg-white rounded-xl border border-white/20 flex items-center justify-center overflow-hidden shadow-lg">
                        {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-1" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/f8f8f8/cccccc?text=No+Image'; }} />
                        ) : (
                            <Package className="w-8 h-8 text-gray-400" />
                        )}
                    </div>
                    <label className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onImageUpload(e.target.files[0])} disabled={uploadingImage === item.id} />
                        {uploadingImage === item.id ? (
                            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
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
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${item.status === 'AVAILABLE' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}`}>
                            {item.status === 'AVAILABLE' ? 'Available' : item.status}
                        </span>
                        <span className="text-sm text-white/70">{getAvailableCount(item.items)}/{item.items?.length || 0} available</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button onClick={onToggleExpand} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                        <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}><ChevronDown className="h-5 w-5" /></div>
                    </button>
                    <button onClick={onEdit} disabled={saving} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all disabled:opacity-50"><Edit2 className="h-5 w-5" /></button>
                    <button onClick={onDelete} disabled={saving} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/50 rounded-xl transition-all disabled:opacity-50"><Trash2 className="h-5 w-5" /></button>
                </div>
            </div>

            {/* Expanded Items */}
            <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-96' : 'max-h-0'}`}>
                {item.items && item.items.length > 0 && (
                    <div className="border-t border-white/10 backdrop-blur-xl bg-slate-800/40 p-4">
                        <h4 className="text-sm font-bold text-white mb-3">Individual Items</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {item.items.map((eqItem) => (
                                <div key={eqItem.id} className="backdrop-blur-2xl bg-slate-700/50 rounded-xl p-3 border border-white/10 hover:bg-slate-600/50 transition-all">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-white text-sm">ID: {eqItem.itemCode}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(eqItem.status as EquipmentItemStatus)}`}>{eqItem.status}</span>
                                    </div>
                                    <div className="relative">
                                        <select value={eqItem.status} onChange={(e) => onStatusChange(eqItem.id, e.target.value as EquipmentItemStatus, eqItem.itemCode)} disabled={saving}
                                            className="w-full text-sm backdrop-blur-xl bg-slate-800/60 border border-white/20 rounded-lg p-2 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 cursor-pointer appearance-none" style={{ colorScheme: 'dark' }}>
                                            <option value="AVAILABLE" className="bg-slate-800">✓ Available</option>
                                            <option value="UNAVAILABLE" className="bg-slate-800">✗ Unavailable</option>
                                            <option value="RENTED" className="bg-slate-800">◉ Rented</option>
                                        </select>
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <svg className="w-3 h-3 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
