import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import type { Rental } from '../types';
import { History, Package, Calendar, FileText, Clock, Loader, CheckCircle, ArrowUpRight, RotateCcw, XCircle, Ban, AlertTriangle, X, Activity, Archive } from 'lucide-react';

type TabType = 'active' | 'history';

export default function MyRentals() {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('active');

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
            await fetchMyRentals();
            setShowCancelModal(false);
            setCancellingRental(null);
        } catch (err: any) {
            // Make error messages user-friendly
            const rawMessage = err.response?.data?.message || 'Failed to cancel rental';
            let friendlyMessage = rawMessage;

            if (rawMessage.includes('CHECKED_OUT') && rawMessage.includes('CANCELLED')) {
                friendlyMessage = 'You have already picked up this equipment. Please return it to complete the rental.';
            } else if (rawMessage.includes('RETURNED')) {
                friendlyMessage = 'This rental has already been completed and returned.';
            } else if (rawMessage.includes('REJECTED')) {
                friendlyMessage = 'This rental request was rejected and cannot be cancelled.';
            }

            setError(friendlyMessage);
        } finally {
            setCancelLoading(false);
        }
    };

    const canCancel = (status: string) => {
        return ['PENDING', 'APPROVED'].includes(status);
    };

    const getStatusInfo = (status: string) => {
        const map: Record<string, { label: string; color: string; bgColor: string; Icon: React.ComponentType<any> }> = {
            'PENDING': { label: 'Pending', color: 'text-amber-400', bgColor: 'bg-amber-500/20 border-amber-500/30', Icon: Loader },
            'APPROVED': { label: 'Approved', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20 border-emerald-500/30', Icon: CheckCircle },
            'CHECKED_OUT': { label: 'Checked Out', color: 'text-sky-400', bgColor: 'bg-sky-500/20 border-sky-500/30', Icon: ArrowUpRight },
            'RETURNED': { label: 'Returned', color: 'text-slate-400', bgColor: 'bg-slate-500/20 border-slate-500/30', Icon: RotateCcw },
            'REJECTED': { label: 'Rejected', color: 'text-rose-400', bgColor: 'bg-rose-500/20 border-rose-500/30', Icon: XCircle },
            'CANCELLED': { label: 'Cancelled', color: 'text-rose-400', bgColor: 'bg-rose-500/20 border-rose-500/30', Icon: Ban },
        };
        return map[status] || { label: status, color: 'text-slate-400', bgColor: 'bg-slate-500/20 border-slate-500/30', Icon: Package };
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

    // Filter rentals by tab
    const activeStatuses = ['PENDING', 'APPROVED', 'CHECKED_OUT'];
    const historyStatuses = ['RETURNED', 'REJECTED', 'CANCELLED'];

    const activeRentals = rentals.filter(r => activeStatuses.includes(r.status));
    const historyRentals = rentals.filter(r => historyStatuses.includes(r.status));

    const displayedRentals = activeTab === 'active' ? activeRentals : historyRentals;

    // Summary stats
    const stats = {
        pending: rentals.filter(r => r.status === 'PENDING').length,
        approved: rentals.filter(r => r.status === 'APPROVED').length,
        checkedOut: rentals.filter(r => r.status === 'CHECKED_OUT').length,
        returned: rentals.filter(r => r.status === 'RETURNED').length,
    };

    if (loading) return <div className="min-h-[80vh] flex items-center justify-center"><div className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl p-8 border border-white/20 shadow-xl"><span className="text-white">Loading...</span></div></div>;
    if (error && rentals.length === 0) return <div className="min-h-[80vh] flex items-center justify-center"><div className="backdrop-blur-2xl bg-red-900/50 rounded-2xl p-8 border border-red-500/30 shadow-xl"><p className="text-red-200">{error}</p></div></div>;

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <History className="w-8 h-8 text-white" />
                <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>My Rentals</h1>
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

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="backdrop-blur-2xl bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                    <div className="flex items-center gap-2 text-amber-400 mb-1">
                        <Loader className="w-4 h-4" />
                        <span className="text-sm font-medium">Pending</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.pending}</p>
                </div>
                <div className="backdrop-blur-2xl bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                    <div className="flex items-center gap-2 text-emerald-400 mb-1">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Approved</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.approved}</p>
                </div>
                <div className="backdrop-blur-2xl bg-sky-500/10 rounded-xl p-4 border border-sky-500/20">
                    <div className="flex items-center gap-2 text-sky-400 mb-1">
                        <ArrowUpRight className="w-4 h-4" />
                        <span className="text-sm font-medium">Checked Out</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.checkedOut}</p>
                </div>
                <div className="backdrop-blur-2xl bg-slate-500/10 rounded-xl p-4 border border-slate-500/20">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <RotateCcw className="w-4 h-4" />
                        <span className="text-sm font-medium">Returned</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.returned}</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-200 ${activeTab === 'active'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                        : 'bg-slate-800/50 text-white/70 hover:bg-slate-700/50 hover:text-white border border-white/10'
                        }`}
                >
                    <Activity className="w-4 h-4" />
                    Active
                    {activeRentals.length > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'active' ? 'bg-white/20' : 'bg-blue-500/30 text-blue-300'}`}>
                            {activeRentals.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-200 ${activeTab === 'history'
                        ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg'
                        : 'bg-slate-800/50 text-white/70 hover:bg-slate-700/50 hover:text-white border border-white/10'
                        }`}
                >
                    <Archive className="w-4 h-4" />
                    History
                    {historyRentals.length > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'history' ? 'bg-white/20' : 'bg-slate-500/30 text-slate-300'}`}>
                            {historyRentals.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Rental Cards */}
            {displayedRentals.length === 0 ? (
                <div className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl border border-white/20 p-12 text-center shadow-xl">
                    {activeTab === 'active' ? (
                        <>
                            <Activity className="w-16 h-16 mx-auto mb-4 text-white/30" />
                            <h3 className="text-xl font-semibold text-white mb-2">No active rentals</h3>
                            <p className="text-white/50">You don't have any pending or active rental requests</p>
                        </>
                    ) : (
                        <>
                            <Archive className="w-16 h-16 mx-auto mb-4 text-white/30" />
                            <h3 className="text-xl font-semibold text-white mb-2">No rental history</h3>
                            <p className="text-white/50">Your completed rentals will appear here</p>
                        </>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {displayedRentals.map((rental: any, idx) => {
                        const st = getStatusInfo(rental.status);
                        const days = getDaysRemaining(rental.endDate, rental.status);
                        return (
                            <div key={rental.id} className={`backdrop-blur-2xl bg-slate-900/60 rounded-2xl border overflow-hidden shadow-xl transition-all duration-300 hover:bg-slate-800/60 ${st.bgColor}`} style={{ animationDelay: `${idx * 50}ms` }}>
                                <div className="flex flex-col md:flex-row">
                                    {/* Image */}
                                    <div className="md:w-36 h-36 flex-shrink-0 bg-white flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-white/10">
                                        {rental.equipment?.imageUrl ? <img src={rental.equipment.imageUrl} alt="" className="w-full h-full object-contain p-3" /> : <Package className="w-12 h-12 text-gray-400" />}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 p-5">
                                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                                            <div>
                                                <h3 className="font-bold text-white text-lg">{rental.equipment?.name || 'Unknown'}</h3>
                                                {rental.equipmentItem?.itemCode && <p className="text-white/50 text-sm">Item ID: {rental.equipmentItem.itemCode}</p>}
                                            </div>
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${st.color} ${st.bgColor} border`}>
                                                <st.Icon className="w-3.5 h-3.5" />
                                                {st.label}
                                            </div>
                                        </div>

                                        {/* Dates */}
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

                                        {/* Actions & Info */}
                                        <div className="flex flex-wrap items-center gap-3">
                                            {days && (
                                                <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium ${days.color} ${days.bgColor}`}>
                                                    ⏰ {days.text}
                                                </div>
                                            )}

                                            {canCancel(rental.status) && (
                                                <button
                                                    onClick={() => handleCancelClick(rental.id, rental.equipment?.name || 'Unknown')}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 text-sm font-medium transition-all duration-200 border border-red-500/30 hover:border-red-500/50"
                                                >
                                                    <Ban className="w-3.5 h-3.5" />
                                                    Cancel Request
                                                </button>
                                            )}
                                        </div>

                                        {/* Request Details */}
                                        {rental.requestDetails && (
                                            <div className="mt-3 pt-3 border-t border-white/10">
                                                <div className="flex items-start gap-2">
                                                    <FileText className="w-4 h-4 text-white/50 mt-0.5" />
                                                    <p className="text-sm text-white/60">{rental.requestDetails}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Rejection Reason */}
                                        {rental.status === 'REJECTED' && rental.rejectReason && (
                                            <div className="mt-3 pt-3 border-t border-red-500/20">
                                                <div className="flex items-start gap-2 bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                                                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-sm font-medium text-red-400 mb-1">Rejection Reason:</p>
                                                        <p className="text-sm text-red-300/80">{rental.rejectReason}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
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
