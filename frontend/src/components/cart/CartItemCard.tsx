import { ShoppingBag, Clock, Trash2 } from 'lucide-react';

export interface CartItemData {
    itemId: string;
    equipmentId: string;
    equipmentName: string;
    equipmentImage?: string;
    itemCode: string;
    expiresAt: number;
}

interface CartItemCardProps {
    item: CartItemData;
    onRemove: () => void;
    formatTimeRemaining: (expiresAt: number) => string;
}

export default function CartItemCard({ item, onRemove, formatTimeRemaining }: CartItemCardProps) {
    return (
        <div className="group backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all animate-fade-in-up">
            <div className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-xl bg-white overflow-hidden flex-shrink-0 shadow-lg">
                    {item.equipmentImage ? (
                        <img src={item.equipmentImage} alt={item.equipmentName} className="w-full h-full object-contain p-1" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400"><ShoppingBag className="w-6 h-6" /></div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white truncate">{item.equipmentName}</h4>
                    <p className="text-sm text-white/50">Item Code: {item.itemCode}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <Clock className="h-3 w-3 text-amber-400" />
                        <span className="text-xs font-mono text-amber-400">{formatTimeRemaining(item.expiresAt)}</span>
                    </div>
                </div>
                <button onClick={onRemove} className="p-2 text-red-400 hover:bg-red-500/20 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
