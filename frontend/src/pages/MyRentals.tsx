import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import type { Rental } from '../types';
import { History, Package, Calendar, FileText, Clock, Loader, CheckCircle, ArrowUpRight, RotateCcw, XCircle, Ban, AlertTriangle, X } from 'lucide-react';

export default function MyRentals() {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Cancel confirmation modal state
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancellingRental, setCancellingRental] = useState<{ id: string; name: string } | null>(null);
    const [cancelLoading, setCancelLoading] = useState(false);

    useEffect(() => { fetchMyRentals(); }, []);

    const fetchMyRentals = async () => {
        try {
            const response = await apiClient.get<Rental[]>('/rentals/me');
            const sorted = response.data.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
            setRentals(sorted);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load your rentals');
        } finally { setLoading(false); }
    };

    const handleCancelClick = (rentalId: string, equipmentName: string) => {
        setCancellingRental({ id: rentalId, name: equipmentName });
        setShowCancelModal(true);
    };

    const handleConfirmCancel = async () => {
        if (!cancellingRental) return;

        setCancelLoading(true);
        try {
            await apiClient.patch(`/rentals/${cancellingRental.id}/status`, {
                status: 'CANCELLED'
            });
            // Refresh rentals
            await fetchMyRentals();
            setShowCancelModal(false);
            setCancellingRental(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to cancel rental');
        } finally {
            setCancelLoading(false);
        }
    };

    const canCancel = (status: string) => {
        // Can only cancel PENDING or APPROVED rentals (before checkout)
        return ['PENDING', 'APPROVED'].includes(status);
    };

    const getStatusInfo = (status: string) => {
        const map: Record<string, { label: string; color: string; Icon: React.ComponentType<any> }> = {
            'PENDING': { label: 'Pending', color: 'bg-amber-500/80', Icon: Loader },
            'APPROVED': { label: 'Approved', color: 'bg-emerald-500/80', Icon: CheckCircle },
            'CHECKED_OUT': { label: 'Checked Out', color: 'bg-sky-500/80', Icon: ArrowUpRight },
            'RETURNED': { label: 'Returned', color: 'bg-slate-500/80', Icon: RotateCcw },
            'REJECTED': { label: 'Rejected', color: 'bg-rose-500/80', Icon: XCircle },
            'CANCELLED': { label: 'Cancelled', color: 'bg-rose-500/80', Icon: Ban },
        };
        return map[status] || { label: status, color: 'bg-slate-500/80', Icon: Package };
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const getDaysRemaining = (endDate: string, status: string) => {
        if (!['APPROVED', 'CHECKED_OUT'].includes(status)) return null;
        const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
        if (diff < 0) return { text: 'Overdue', color: 'text-red-400' };
        if (diff === 0) return { text: 'Due today', color: 'text-amber-400' };
        return { text: `${diff} day${diff > 1 ? 's' : ''} left`, color: 'text-green-400' };
    };

    if (loading) return <div className="min-h-[80vh] flex items-center justify-center"><div className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl p-8 border border-white/20 shadow-xl"><span className="text-white">Loading...</span></div></div>;
    if (error && rentals.length === 0) return <div className="min-h-[80vh] flex items-center justify-center"><div className="backdrop-blur-2xl bg-red-900/50 rounded-2xl p-8 border border-red-500/30 shadow-xl"><p className="text-red-200">{error}</p></div></div>;

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <History className="w-8 h-8 text-white" />
                <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>My Rental History</h1>
            </div>

            {error && (
                <div className="backdrop-blur-2xl bg-red-900/50 rounded-xl p-4 border border-red-500/30 mb-6 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-red-200 text-sm">{error}</p>
                    <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {rentals.length === 0 ? (
                <div className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl border border-white/20 p-12 text-center shadow-xl">
                    <Package className="w-16 h-16 mx-auto mb-4 text-white/30" />
                    <h3 className="text-xl font-semibold text-white mb-2">No rental history yet</h3>
                    <p className="text-white/50">Select equipment from the list to start renting</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {rentals.map((rental: any, idx) => {
                        const st = getStatusInfo(rental.status);
                        const days = getDaysRemaining(rental.endDate, rental.status);
                        return (
                            <div key={rental.id} className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl border border-white/20 overflow-hidden shadow-xl transition-all duration-300 hover:bg-slate-800/60" style={{ animationDelay: `${idx * 50}ms` }}>
                                <div className="flex flex-col md:flex-row">
                                    <div className="md:w-32 h-32 flex-shrink-0 bg-white flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-white/10 rounded-br-xl">
                                        {rental.equipment?.imageUrl ? <img src={rental.equipment.imageUrl} alt="" className="w-full h-full object-contain p-2" /> : <Package className="w-10 h-10 text-gray-400" />}
                                    </div>
                                    <div className="flex-1 p-5">
                                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                                            <div><h3 className="font-bold text-white text-lg">{rental.equipment?.name || 'Unknown'}</h3>{rental.equipmentItem?.itemCode && <p className="text-white/50 text-sm">ID: {rental.equipmentItem.itemCode}</p>}</div>
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white ${st.color}`}><st.Icon className="w-3.5 h-3.5" />{st.label}</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                            <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-white/50" /><span className="text-white/50">Start:</span><span className="text-white">{formatDate(rental.startDate)}</span></div>
                                            <div className="flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-white/50" /><span className="text-white/50">End:</span><span className="text-white">{formatDate(rental.endDate)}</span></div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            {days && <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-sm ${days.color}`}>⏰ {days.text}</div>}

                                            {/* Cancel Button - only show for PENDING or APPROVED */}
                                            {canCancel(rental.status) && (
                                                <button
                                                    onClick={() => handleCancelClick(rental.id, rental.equipment?.name || 'Unknown')}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 text-sm font-medium transition-all duration-200 border border-red-500/30 hover:border-red-500/50"
                                                >
                                                    <Ban className="w-3.5 h-3.5" />
                                                    Cancel Request
                                                </button>
                                            )}
                                        </div>
                                        {rental.requestDetails && <div className="mt-3 pt-3 border-t border-white/10"><div className="flex items-start gap-2"><FileText className="w-4 h-4 text-white/50 mt-0.5" /><p className="text-sm text-white/60">{rental.requestDetails}</p></div></div>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {showCancelModal && cancellingRental && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in" onClick={() => !cancelLoading && setShowCancelModal(false)} />
                    <div className="relative backdrop-blur-2xl bg-gradient-to-b from-slate-800/95 to-slate-900/95 rounded-3xl shadow-2xl max-w-sm w-full mx-4 p-6 animate-scale-in border border-white/20">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                                <AlertTriangle className="h-8 w-8 text-red-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Cancel Rental Request</h3>
                            <p className="text-white/60">
                                Are you sure you want to cancel your rental request for <span className="text-white font-semibold">{cancellingRental.name}</span>?
                            </p>
                            <p className="text-amber-400/80 text-sm mt-2">This action cannot be undone.</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                disabled={cancelLoading}
                                className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-white/10 hover:bg-white/20 transition-all duration-200 border border-white/20 disabled:opacity-50"
                            >
                                Keep Request
                            </button>
                            <button
                                onClick={handleConfirmCancel}
                                disabled={cancelLoading}
                                className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {cancelLoading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Cancelling...
                                    </>
                                ) : (
                                    'Cancel Request'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
