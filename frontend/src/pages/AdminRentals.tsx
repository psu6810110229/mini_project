import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import type { Rental } from '../types';
import { ClipboardList, AlertTriangle, CheckCircle } from 'lucide-react';

export default function AdminRentals() {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ id: string; status: string; userName: string } | null>(null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchRentals();
    }, []);

    const fetchRentals = async () => {
        try {
            const response = await apiClient.get<Rental[]>('/rentals');
            const sorted = response.data.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
            setRentals(sorted);
        } catch (err) {
            console.error('Failed to load rentals');
        } finally {
            setLoading(false);
        }
    };

    const showConfirmation = (id: string, status: string, userName: string) => {
        setConfirmAction({ id, status, userName });
        setShowConfirmModal(true);
    };

    const handleConfirmedAction = async () => {
        if (!confirmAction) return;

        try {
            await apiClient.patch(`/rentals/${confirmAction.id}/status`, { status: confirmAction.status });
            setSuccessMessage(`Status updated to ${confirmAction.status} successfully`);
            fetchRentals();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            alert('Failed to update status');
        }

        setShowConfirmModal(false);
        setConfirmAction(null);
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING': return 'Pending';
            case 'APPROVED': return 'Approved';
            case 'CHECKED_OUT': return 'Checked Out';
            case 'RETURNED': return 'Returned';
            case 'REJECTED': return 'Rejected';
            case 'CANCELLED': return 'Cancelled';
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-600 text-white';
            case 'APPROVED': return 'bg-green-600 text-white';
            case 'CHECKED_OUT': return 'bg-blue-600 text-white';
            case 'RETURNED': return 'bg-gray-600 text-white';
            case 'REJECTED': return 'bg-red-600 text-white';
            case 'CANCELLED': return 'bg-red-600 text-white';
            default: return 'bg-gray-600 text-white';
        }
    };

    const getActionLabel = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'approve this request';
            case 'REJECTED': return 'reject this request';
            case 'CHECKED_OUT': return 'confirm equipment checkout';
            case 'RETURNED': return 'confirm equipment return';
            default: return status;
        }
    };

    if (loading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl p-8 border border-white/20 shadow-xl">
                    <div className="flex items-center gap-3">
                        <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-white font-medium">Loading rentals...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* Success Message */}
            {successMessage && (
                <div className="mb-6 flex gap-3 backdrop-blur-2xl bg-green-900/50 border border-green-500/30 rounded-xl p-4 shadow-lg animate-fade-in">
                    <CheckCircle className="h-5 w-5 text-green-300 flex-shrink-0 mt-0.5" />
                    <p className="text-green-200 font-semibold">{successMessage}</p>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <ClipboardList className="w-8 h-8 text-white" />
                <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>
                    Manage Rentals
                </h1>
            </div>

            {/* Table */}
            <div className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl border border-white/20 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="backdrop-blur-xl bg-slate-800/60 border-b border-white/20">
                            <tr>
                                <th className="p-4 text-white font-semibold">Requester</th>
                                <th className="p-4 text-white font-semibold">Equipment</th>
                                <th className="p-4 text-white font-semibold">Duration</th>
                                <th className="p-4 text-white font-semibold">Status</th>
                                <th className="p-4 text-center text-white font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {rentals.map((rental: any) => (
                                <tr key={rental.id} className="hover:bg-white/5 transition-colors duration-200">
                                    <td className="p-4">
                                        <div className="font-semibold text-white">{rental.user?.name || 'Unknown'}</div>
                                        <div className="text-xs text-white/60">{rental.user?.studentId}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="font-semibold text-white">{rental.equipment?.name}</span>
                                        {rental.equipmentItem?.itemCode && (
                                            <span className="ml-2 text-xs text-white/60">(ID: {rental.equipmentItem.itemCode})</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="w-12 text-white/60 font-medium">Start:</span>
                                                <span className="text-white font-medium">
                                                    {new Date(rental.startDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                                <span className="text-white/50 text-xs">
                                                    {new Date(rental.startDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="w-12 text-white/60 font-medium">End:</span>
                                                <span className="text-white font-medium">
                                                    {new Date(rental.endDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                                <span className="text-white/50 text-xs">
                                                    {new Date(rental.endDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="text-xs text-blue-400 font-medium">
                                                📅 {Math.ceil((new Date(rental.endDate).getTime() - new Date(rental.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(rental.status)}`}>
                                            {getStatusLabel(rental.status)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-2 flex-wrap">
                                            {rental.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => showConfirmation(rental.id, 'APPROVED', rental.user?.name)}
                                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg hover:scale-105"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => showConfirmation(rental.id, 'REJECTED', rental.user?.name)}
                                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg hover:scale-105"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {rental.status === 'APPROVED' && (
                                                <button
                                                    onClick={() => showConfirmation(rental.id, 'CHECKED_OUT', rental.user?.name)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg hover:scale-105"
                                                >
                                                    Checkout
                                                </button>
                                            )}
                                            {rental.status === 'CHECKED_OUT' && (
                                                <button
                                                    onClick={() => showConfirmation(rental.id, 'RETURNED', rental.user?.name)}
                                                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg hover:scale-105"
                                                >
                                                    Return
                                                </button>
                                            )}
                                            {['RETURNED', 'REJECTED', 'CANCELLED'].includes(rental.status) && (
                                                <span className="text-white/50 text-sm italic">Completed</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {rentals.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-white/60">
                                        No rental requests found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && confirmAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in" onClick={() => setShowConfirmModal(false)} />
                    <div className="relative backdrop-blur-2xl bg-gradient-to-b from-slate-800/95 to-slate-900/95 rounded-3xl shadow-2xl max-w-sm w-full mx-4 p-6 animate-scale-in border border-white/20">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                                <AlertTriangle className="h-8 w-8 text-amber-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Confirm Action</h3>
                            <p className="text-white/60">
                                Are you sure you want to <span className="text-white font-semibold">{getActionLabel(confirmAction.status)}</span>
                                <br />for <span className="text-white font-semibold">{confirmAction.userName}</span>?
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-white/10 hover:bg-white/20 transition-all duration-200 border border-white/20"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmedAction}
                                className={`flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all duration-200 shadow-lg ${confirmAction.status === 'REJECTED'
                                        ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                                        : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                                    }`}
                            >
                                Confirm
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
