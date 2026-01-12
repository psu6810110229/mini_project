import { Package, Calendar, Clock, FileText, Ban, AlertTriangle, Camera, CheckCircle } from 'lucide-react';
import type { Rental } from '../../types';

interface RentalItemCardProps {
    rental: Rental;
    onCancel?: (id: string, name: string) => void;
    onUpload?: (rental: Rental) => void;
}

const getStatusInfo = (status: string) => {
    const map: Record<string, { label: string; color: string; bgColor: string }> = {
        'PENDING': { label: 'Pending', color: 'text-amber-400', bgColor: 'bg-amber-500/20 border-amber-500/30' },
        'APPROVED': { label: 'Approved', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20 border-emerald-500/30' },
        'CHECKED_OUT': { label: 'Checked Out', color: 'text-sky-400', bgColor: 'bg-sky-500/20 border-sky-500/30' },
        'RETURNED': { label: 'Returned', color: 'text-slate-400', bgColor: 'bg-slate-500/20 border-slate-500/30' },
        'REJECTED': { label: 'Rejected', color: 'text-rose-400', bgColor: 'bg-rose-500/20 border-rose-500/30' },
        'CANCELLED': { label: 'Cancelled', color: 'text-orange-400', bgColor: 'bg-orange-500/20 border-orange-500/30' },
    };
    return map[status] || { label: status, color: 'text-slate-400', bgColor: 'bg-slate-500/20 border-slate-500/30' };
};

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const getDaysRemaining = (endDate: string, status: string) => {
    if (!['APPROVED', 'CHECKED_OUT'].includes(status)) return null;
    const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
    if (diff < 0) return { text: 'Overdue', color: 'text-red-400', bgColor: 'bg-red-500/20' };
    if (diff === 0) return { text: 'Due today', color: 'text-amber-400', bgColor: 'bg-amber-500/20' };
    return { text: `${diff} day${diff > 1 ? 's' : ''} left`, color: 'text-green-400', bgColor: 'bg-green-500/20' };
};

const canCancel = (status: string) => ['PENDING', 'APPROVED'].includes(status);
const canUpload = (status: string) => ['APPROVED', 'CHECKED_OUT'].includes(status);

/**
 * Individual rental card displayed on the "My Rentals" page.
 * Shows status-specific actions (Cancel, Upload Evidence) and photo upload badges.
 */
export default function RentalItemCard({ rental, onCancel, onUpload }: RentalItemCardProps) {
    const st = getStatusInfo(rental.status);
    const days = getDaysRemaining(rental.endDate, rental.status);


    return (
        <div className={`backdrop-blur-2xl bg-slate-900/60 rounded-2xl border overflow-hidden shadow-xl transition-all hover:bg-slate-800/60 ${st.bgColor}`}>
            <div className="flex flex-col md:flex-row">
                <div className="md:w-40 w-full h-40 md:h-auto flex-shrink-0 bg-white flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-white/10">
                    {rental.equipment?.imageUrl ? (
                        <img src={rental.equipment.imageUrl} alt="" className="w-full h-full object-cover md:object-contain p-2" style={{ maxHeight: '160px' }} />
                    ) : (
                        <Package className="w-12 h-12 text-gray-400" />
                    )}
                </div>
                <div className="flex-1 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                        <div>
                            <h3 className="font-bold text-white text-lg">{rental.equipment?.name || 'Unknown'}</h3>
                            {rental.equipmentItem?.itemCode && <p className="text-white/50 text-sm">Item ID: {rental.equipmentItem.itemCode}</p>}
                        </div>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${st.color} ${st.bgColor} border`}>{st.label}</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div className="flex items-center gap-2 text-sm bg-white/5 rounded-lg px-3 py-2">
                            <Calendar className="w-4 h-4 text-white/50" />
                            <span className="text-white/50">Start:</span>
                            <span className="text-white font-medium">{formatDate(rental.startDate)}</span>
                            <span className="text-white/40 text-xs">{formatTime(rental.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm bg-white/5 rounded-lg px-3 py-2">
                            <Clock className="w-4 h-4 text-white/50" />
                            <span className="text-white/50">End:</span>
                            <span className="text-white font-medium">{formatDate(rental.endDate)}</span>
                            <span className="text-white/40 text-xs">{formatTime(rental.endDate)}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {days && <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium ${days.color} ${days.bgColor}`}>⏰ {days.text}</div>}

                        {/* Cancel Button */}
                        {onCancel && canCancel(rental.status) && (
                            <button onClick={() => onCancel(rental.id, rental.equipment?.name || 'Unknown')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 text-sm font-medium transition-all border border-red-500/30 hover:border-red-500/50">
                                <Ban className="w-3.5 h-3.5" /> Cancel Request
                            </button>
                        )}

                        {/* Upload Evidence Button */}
                        {onUpload && canUpload(rental.status) && (
                            <button onClick={() => onUpload(rental)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 text-sm font-medium transition-all border border-blue-500/30 hover:border-blue-500/50">
                                <Camera className="w-3.5 h-3.5" />
                                {rental.status === 'APPROVED' ? 'Upload Pickup Photo' : 'Upload Return Photo'}
                            </button>
                        )}

                        {/* Pickup Evidence Badge */}
                        {rental.checkoutImageUrl && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20">
                                <CheckCircle className="w-3 h-3" /> <span>Pickup Photo</span>
                            </span>
                        )}
                        {/* Return Evidence Badge */}
                        {rental.returnImageUrl && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-lg border border-green-500/20">
                                <CheckCircle className="w-3 h-3" /> <span>Return Photo</span>
                            </span>
                        )}
                    </div>

                    {rental.requestDetails && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                            <div className="flex items-start gap-2"><FileText className="w-4 h-4 text-white/50 mt-0.5" /><p className="text-sm text-white/60">{rental.requestDetails}</p></div>
                        </div>
                    )}

                    {rental.status === 'REJECTED' && rental.rejectReason && (
                        <div className="mt-3 pt-3 border-t border-red-500/20">
                            <div className="flex items-start gap-2 bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                <div><p className="text-sm font-medium text-red-400 mb-1">Rejection Reason:</p><p className="text-sm text-red-300/80">{rental.rejectReason}</p></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
