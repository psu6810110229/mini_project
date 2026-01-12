import { Plus, X, ShoppingBag, Package, Clock, Calendar } from 'lucide-react';
import type { EquipmentItem } from '../../types';
import { ConfirmModal } from '../ui';
import { useState } from 'react';

// Type for active rentals
export interface ActiveRental {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    equipmentItemId: string;
    itemCode: string;
    userName: string;
}

interface EquipmentRentalActionsProps {
    isAdmin: boolean;
    availableItemsForCart: EquipmentItem[];
    inCartItems: EquipmentItem[];
    activeRentals: ActiveRental[];
    onAddToCart: (item: EquipmentItem) => void;
    onRemoveFromCart: (id: string) => void;
    formatDate: (dateStr: string) => string;
}

export default function EquipmentRentalActions({
    isAdmin, availableItemsForCart, inCartItems, activeRentals, onAddToCart, onRemoveFromCart, formatDate
}: EquipmentRentalActionsProps) {
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ itemId: string; itemCode: string } | null>(null);

    // Admin View
    if (isAdmin) {
        return (
            <div className="backdrop-blur-2xl bg-slate-800/50 p-6 rounded-xl border border-white/20">
                <p className="text-center text-white/70 font-medium">👨‍💼 โหมดแอดมิน - ไม่สามารถยืมได้</p>
            </div>
        );
    }

    return (
        <>
            {/* Items Available to Add */}
            {availableItemsForCart.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">เลือกรายการที่จะยืม</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {availableItemsForCart.map((item, i) => (
                            <button
                                key={item.id}
                                onClick={() => onAddToCart(item)}
                                className="flex items-center justify-between backdrop-blur-2xl bg-slate-800/50 border border-white/20 hover:border-blue-500/50 rounded-xl p-3 transition-all hover:bg-slate-700/50 hover:scale-[1.02] group animate-fade-in"
                                style={{ animationDelay: `${i * 50}ms` }}
                            >
                                <div className="text-left">
                                    <span className="font-bold text-white">Item: {item.itemCode}</span>
                                    <span className="block text-xs text-green-400 font-medium">ว่าง</span>
                                </div>
                                <div className="backdrop-blur-xl bg-white/10 group-hover:bg-blue-600 p-2 rounded-lg transition-all group-hover:scale-110">
                                    <Plus className="h-4 w-4 text-white" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Items Already in Cart */}
            {inCartItems.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5" /> อยู่ในรายการยืมของคุณ
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {inCartItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between backdrop-blur-2xl bg-green-900/30 border border-green-500/30 rounded-xl p-3">
                                <div className="text-left">
                                    <span className="font-bold text-white">Item: {item.itemCode}</span>
                                    <span className="block text-xs text-green-300 font-medium">จองแล้ว</span>
                                </div>
                                <button
                                    onClick={() => { setConfirmAction({ itemId: item.id, itemCode: item.itemCode }); setShowConfirmModal(true); }}
                                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-all hover:scale-110"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No Items Available */}
            {availableItemsForCart.length === 0 && inCartItems.length === 0 && (
                <div className="backdrop-blur-2xl bg-slate-800/50 p-6 rounded-xl border border-white/20 text-center">
                    <Package className="w-12 h-12 mx-auto mb-3 text-white/40" />
                    <p className="text-white/70 font-medium">ไม่มีรายการว่าง</p>
                </div>
            )}

            {/* Currently Rented Items */}
            {activeRentals.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-amber-400" /> กำลังถูกยืม ({activeRentals.length})
                    </h3>
                    <div className="space-y-3">
                        {activeRentals.map(rental => (
                            <div key={rental.id} className="backdrop-blur-2xl bg-amber-900/20 border border-amber-500/30 rounded-xl p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <span className="font-bold text-white">Item Code: {rental.itemCode}</span>
                                        <span className="px-2 py-0.5 ml-2 rounded-full text-xs font-medium bg-amber-500/30 text-amber-300">
                                            {rental.status.toLowerCase().replace('_', ' ')}
                                        </span>
                                        <div className="text-sm text-white/70 mt-1">
                                            ยืมโดย: <span className="text-white font-medium">{rental.userName || 'ไม่ทราบ'}</span>
                                        </div>
                                    </div>
                                    <div className="text-right text-sm">
                                        <div className="flex items-center gap-1 text-white">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {formatDate(rental.startDate)}
                                        </div>
                                        <div className="text-white/50 text-xs">ถึง {formatDate(rental.endDate)}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Cart Hint */}
            {inCartItems.length > 0 && (
                <p className="text-sm text-white/60 text-center mt-4 flex items-center justify-center gap-2">
                    <ShoppingBag className="w-4 h-4" /> กดปุ่มรายการยืมด้านล่างขวาเพื่อยืนยัน
                </p>
            )}

            {/* Confirm Remove Modal */}
            <ConfirmModal
                isOpen={showConfirmModal}
                title="นำออกจากรายการ?"
                message={`นำ ${confirmAction?.itemCode} ออกจากรายการยืมของคุณ?`}
                variant="warning"
                confirmLabel="นำออก"
                onConfirm={() => { if (confirmAction) onRemoveFromCart(confirmAction.itemId); setShowConfirmModal(false); setConfirmAction(null); }}
                onCancel={() => { setShowConfirmModal(false); setConfirmAction(null); }}
            />
        </>
    );
}
