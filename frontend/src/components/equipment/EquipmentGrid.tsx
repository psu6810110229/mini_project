import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import type { Equipment } from '../../types';
import { EquipmentItemStatus } from '../../types';

interface EquipmentGridProps {
    equipments: Equipment[];
}

export default function EquipmentGrid({ equipments }: EquipmentGridProps) {
    const getAvailableCount = (equipment: Equipment) => {
        // If equipment-level status is not AVAILABLE, show 0
        if (equipment.status !== 'AVAILABLE') return 0;
        // If items array exists, count available items (can be 0 if all unavailable)
        if (equipment.items && equipment.items.length > 0) {
            return equipment.items.filter(i => i.status === EquipmentItemStatus.AVAILABLE).length;
        }
        // Fallback to stockQty only if no items array
        return equipment.stockQty;
    };
    const getTotalCount = (equipment: Equipment) => equipment.items?.length || equipment.stockQty;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipments.map((item, index) => {
                const availableCount = getAvailableCount(item);
                const totalCount = getTotalCount(item);
                return (
                    <Link
                        key={item.id}
                        to={`/equipments/${item.id}`}
                        className="group backdrop-blur-2xl bg-slate-900/60 rounded-2xl overflow-hidden hover:scale-[1.02] transition-all border border-white/20 hover:border-white/40 shadow-xl animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className="h-48 bg-white flex items-center justify-center border-b border-white/10 overflow-hidden">
                            {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                                <Package className="w-12 h-12 text-gray-400" />
                            )}
                        </div>
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-white mb-2">{item.name}</h2>
                            <p className="text-white/70 text-sm mb-4">{item.category}</p>
                            <div className="flex justify-between items-center text-sm">
                                <span className={`font-bold ${availableCount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {availableCount}/{totalCount} ว่าง
                                </span>
                                <span className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all font-medium">ดูรายละเอียด ›</span>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
