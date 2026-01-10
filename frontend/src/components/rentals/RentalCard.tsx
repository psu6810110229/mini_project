import { Package, FileText, Eye, CheckSquare, Square, AlertOctagon } from 'lucide-react';
import type { Rental } from '../../types';
import { getStatusColor, getStatusLabel, getStatusBorderColor } from '../../utils/statusHelpers';

interface RentalCardProps {
    rental: Rental;
    isSelected: boolean;
    isOverlapping: boolean;
    onToggleSelect: (id: string) => void;
    onViewDetails: (rental: Rental) => void;
    onApprove: (id: string, userName: string) => void;
    onReject: (rental: Rental) => void;
    onCheckout: (id: string, userName: string) => void;
    onReturn: (id: string, userName: string) => void;
}

export default function RentalCard({
    rental, isSelected, isOverlapping, onToggleSelect, onViewDetails,
    onApprove, onReject, onCheckout, onReturn
}: RentalCardProps) {
    const isActionable = !['REJECTED', 'RETURNED', 'CANCELLED'].includes(rental.status);
    const duration = Math.ceil((new Date(rental.endDate).getTime() - new Date(rental.startDate).getTime()) / (1000 * 60 * 60 * 24));

    return (
        <div className={`relative backdrop-blur-2xl bg-slate-900/60 rounded-2xl border-2 overflow-hidden shadow-xl transition-all duration-300 hover:scale-[1.02] ${getStatusBorderColor(rental.status)} ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900' : ''}`}>
            {isActionable && (
                <button onClick={() => onToggleSelect(rental.id)}
                    className={`absolute top-2 left-2 z-10 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${isSelected ? 'bg-blue-500 text-white shadow-lg' : 'bg-black/40 hover:bg-black/60 text-white/70 hover:text-white'}`}>
                    {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                </button>
            )}

            <div className="relative h-32 bg-white flex items-center justify-center border-b border-white/10">
                {rental.equipment?.imageUrl ? (
                    <img src={rental.equipment.imageUrl} alt={rental.equipment.name} className="w-full h-full object-contain p-4" />
                ) : (
                    <Package className="w-12 h-12 text-gray-400" />
                )}
                <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(rental.status)}`}>
                    {getStatusLabel(rental.status)}
                </span>
                {isOverlapping && (
                    <span className="absolute bottom-2 left-2 px-2 py-1 rounded-full text-xs font-bold bg-orange-600 text-white flex items-center gap-1">
                        <AlertOctagon className="w-3 h-3" /> Overlap
                    </span>
                )}
            </div>

            <div className="p-4">
                <div className="mb-3">
                    <div className="font-bold text-white text-lg">{rental.user?.name || 'Unknown'}</div>
                    <div className="text-xs text-white/60">{rental.user?.studentId}</div>
                </div>

                <div className="mb-3 p-2 bg-white/5 rounded-lg">
                    <div className="font-semibold text-white">{rental.equipment?.name}</div>
                    {rental.equipmentItem?.itemCode && (
                        <div className="text-xs text-white/60">Item Code: {rental.equipmentItem.itemCode}</div>
                    )}
                </div>

                <div className="text-sm space-y-1 mb-3">
                    <div className="flex justify-between">
                        <span className="text-white/60">Start:</span>
                        <span className="text-white font-medium">{new Date(rental.startDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-white/60">End:</span>
                        <span className="text-white font-medium">{new Date(rental.endDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="text-center text-xs text-blue-400 font-medium pt-1">📅 {duration} days</div>
                </div>

                {rental.requestDetails && (
                    <div className="mb-3 p-2 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                        <div className="flex items-center gap-1 text-amber-400 text-xs font-medium mb-1">
                            <FileText className="w-3 h-3" /> Request Note
                        </div>
                        <p className="text-white/70 text-xs line-clamp-2">{rental.requestDetails}</p>
                    </div>
                )}

                <div className="flex gap-2 mt-4">
                    <button onClick={() => onViewDetails(rental)}
                        className="flex-1 flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl text-sm font-medium transition-all border border-white/20">
                        <Eye className="w-4 h-4" /> Details
                    </button>
                    {rental.status === 'PENDING' && (
                        <>
                            <button onClick={() => onApprove(rental.id, rental.user?.name || '')} className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-xl text-sm font-semibold shadow-lg">Approve</button>
                            <button onClick={() => onReject(rental)} className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-xl text-sm font-semibold shadow-lg">Reject</button>
                        </>
                    )}
                    {rental.status === 'APPROVED' && (
                        <button onClick={() => onCheckout(rental.id, rental.user?.name || '')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-sm font-semibold shadow-lg">Checkout</button>
                    )}
                    {rental.status === 'CHECKED_OUT' && (
                        <button onClick={() => onReturn(rental.id, rental.user?.name || '')} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-xl text-sm font-semibold shadow-lg">Return</button>
                    )}
                </div>
            </div>
        </div>
    );
}
