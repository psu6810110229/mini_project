import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import type { Rental } from '../types';
import { ClipboardList, AlertTriangle, CheckCircle, Package, X, FileText, Filter, Eye, AlertOctagon } from 'lucide-react';

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'CHECKED_OUT' | 'RETURNED' | 'REJECTED' | 'CANCELLED' | 'OVERLAPPING';

export default function AdminRentals() {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ id: string; status: string; userName: string } | null>(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedRental, setSelectedRental] = useState<any>(null);

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

    // Function to check if two date ranges overlap
    const isOverlapping = (start1: Date, end1: Date, start2: Date, end2: Date) => {
        return start1 < end2 && end1 > start2;
    };

    // Find all rentals that have overlapping times with other rentals (same equipment item)
    const getOverlappingRentalIds = (): Set<string> => {
        const overlappingIds = new Set<string>();
        const activeStatuses = ['PENDING', 'APPROVED', 'CHECKED_OUT'];

        // Only check active rentals for overlaps
        const activeRentals = rentals.filter(r => activeStatuses.includes(r.status));

        for (let i = 0; i < activeRentals.length; i++) {
            for (let j = i + 1; j < activeRentals.length; j++) {
                const r1 = activeRentals[i];
                const r2 = activeRentals[j];

                // Check if same equipment item
                const sameItem = r1.equipmentItemId && r2.equipmentItemId && r1.equipmentItemId === r2.equipmentItemId;
                // Or same equipment (if no item specified)
                const sameEquipment = r1.equipment?.id === r2.equipment?.id;

                if (sameItem || (!r1.equipmentItemId && !r2.equipmentItemId && sameEquipment)) {
                    const start1 = new Date(r1.startDate);
                    const end1 = new Date(r1.endDate);
                    const start2 = new Date(r2.startDate);
                    const end2 = new Date(r2.endDate);

                    if (isOverlapping(start1, end1, start2, end2)) {
                        overlappingIds.add(r1.id);
                        overlappingIds.add(r2.id);
                    }
                }
            }
        }

        return overlappingIds;
    };

    const overlappingRentalIds = getOverlappingRentalIds();

    const filteredRentals = rentals.filter(rental => {
        if (statusFilter === 'ALL') return true;
        if (statusFilter === 'OVERLAPPING') return overlappingRentalIds.has(rental.id);
        return rental.status === statusFilter;
    });

    const showConfirmation = (id: string, status: string, userName: string) => {
        setConfirmAction({ id, status, userName });
        setShowConfirmModal(true);
    };

    const handleConfirmedAction = async () => {
        if (!confirmAction) return;

        try {
            const response = await apiClient.patch<{ autoRejectedRentals?: string[] }>(
                `/rentals/${confirmAction.id}/status`,
                { status: confirmAction.status }
            );

            let message = `Status updated to ${confirmAction.status} successfully`;

            // If there were auto-rejected rentals, show them
            if (response.data.autoRejectedRentals && response.data.autoRejectedRentals.length > 0) {
                message += `. Auto-rejected ${response.data.autoRejectedRentals.length} overlapping request(s): ${response.data.autoRejectedRentals.join(', ')}`;
            }

            setSuccessMessage(message);
            fetchRentals();
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (err) {
            alert('Failed to update status');
        }

        setShowConfirmModal(false);
        setConfirmAction(null);
    };

    const openDetailModal = (rental: any) => {
        setSelectedRental(rental);
        setShowDetailModal(true);
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

    const getStatusBorderColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'border-yellow-500/50 hover:border-yellow-400';
            case 'APPROVED': return 'border-green-500/50 hover:border-green-400';
            case 'CHECKED_OUT': return 'border-blue-500/50 hover:border-blue-400';
            case 'RETURNED': return 'border-gray-500/50 hover:border-gray-400';
            case 'REJECTED': return 'border-red-500/50 hover:border-red-400';
            case 'CANCELLED': return 'border-red-500/50 hover:border-red-400';
            default: return 'border-white/20';
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

    const statusCounts: Record<StatusFilter, number> = {
        ALL: rentals.length,
        PENDING: rentals.filter(r => r.status === 'PENDING').length,
        APPROVED: rentals.filter(r => r.status === 'APPROVED').length,
        CHECKED_OUT: rentals.filter(r => r.status === 'CHECKED_OUT').length,
        RETURNED: rentals.filter(r => r.status === 'RETURNED').length,
        REJECTED: rentals.filter(r => r.status === 'REJECTED').length,
        CANCELLED: rentals.filter(r => r.status === 'CANCELLED').length,
        OVERLAPPING: overlappingRentalIds.size,
    };

    const filterButtons: { key: StatusFilter; label: string; color: string; icon?: React.ReactNode }[] = [
        { key: 'ALL', label: 'All', color: 'bg-slate-600' },
        { key: 'OVERLAPPING', label: 'Overlapping', color: 'bg-orange-600', icon: <AlertOctagon className="w-4 h-4" /> },
        { key: 'PENDING', label: 'Pending', color: 'bg-yellow-600' },
        { key: 'APPROVED', label: 'Approved', color: 'bg-green-600' },
        { key: 'CHECKED_OUT', label: 'Checked Out', color: 'bg-blue-600' },
        { key: 'RETURNED', label: 'Returned', color: 'bg-gray-600' },
        { key: 'REJECTED', label: 'Rejected', color: 'bg-red-600' },
    ];

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
            <div className="flex items-center gap-3 mb-6">
                <ClipboardList className="w-8 h-8 text-white" />
                <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>
                    Manage Rentals
                </h1>
            </div>

            {/* Status Filter */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-5 h-5 text-white/70" />
                    <span className="text-white/70 font-medium">Filter by Status</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {filterButtons.map(({ key, label, color, icon }) => (
                        <button
                            key={key}
                            onClick={() => setStatusFilter(key)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border ${statusFilter === key
                                ? `${color} text-white border-white/30 shadow-lg scale-105`
                                : 'bg-slate-800/50 text-white/70 border-white/10 hover:bg-slate-700/50 hover:text-white'
                                }`}
                        >
                            {icon}
                            {label}
                            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${statusFilter === key ? 'bg-white/20' : 'bg-white/10'
                                }`}>
                                {statusCounts[key]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Rental Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRentals.map((rental: any) => (
                    <div
                        key={rental.id}
                        className={`backdrop-blur-2xl bg-slate-900/60 rounded-2xl border-2 overflow-hidden shadow-xl transition-all duration-300 hover:scale-[1.02] ${getStatusBorderColor(rental.status)}`}
                    >
                        {/* Equipment Image */}
                        <div className="relative h-32 bg-white flex items-center justify-center border-b border-white/10">
                            {rental.equipment?.imageUrl ? (
                                <img
                                    src={rental.equipment.imageUrl}
                                    alt={rental.equipment.name}
                                    className="w-full h-full object-contain p-4"
                                />
                            ) : (
                                <Package className="w-12 h-12 text-gray-400" />
                            )}
                            {/* Status Badge */}
                            <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(rental.status)}`}>
                                {getStatusLabel(rental.status)}
                            </span>
                            {/* Overlapping Warning Badge */}
                            {overlappingRentalIds.has(rental.id) && (
                                <span className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold bg-orange-600 text-white flex items-center gap-1">
                                    <AlertOctagon className="w-3 h-3" />
                                    Overlap
                                </span>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            {/* Requester */}
                            <div className="mb-3">
                                <div className="font-bold text-white text-lg">{rental.user?.name || 'Unknown'}</div>
                                <div className="text-xs text-white/60">{rental.user?.studentId}</div>
                            </div>

                            {/* Equipment Info */}
                            <div className="mb-3 p-2 bg-white/5 rounded-lg">
                                <div className="font-semibold text-white">{rental.equipment?.name}</div>
                                {rental.equipmentItem?.itemCode && (
                                    <div className="text-xs text-white/60">Item Code: {rental.equipmentItem.itemCode}</div>
                                )}
                            </div>

                            {/* Duration */}
                            <div className="text-sm space-y-1 mb-3">
                                <div className="flex justify-between">
                                    <span className="text-white/60">Start:</span>
                                    <span className="text-white font-medium">
                                        {new Date(rental.startDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/60">End:</span>
                                    <span className="text-white font-medium">
                                        {new Date(rental.endDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                <div className="text-center text-xs text-blue-400 font-medium pt-1">
                                    📅 {Math.ceil((new Date(rental.endDate).getTime() - new Date(rental.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                                </div>
                            </div>

                            {/* Request Details Preview */}
                            {rental.requestDetails && (
                                <div className="mb-3 p-2 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                                    <div className="flex items-center gap-1 text-amber-400 text-xs font-medium mb-1">
                                        <FileText className="w-3 h-3" />
                                        Request Note
                                    </div>
                                    <p className="text-white/70 text-xs line-clamp-2">{rental.requestDetails}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => openDetailModal(rental)}
                                    className="flex-1 flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border border-white/20"
                                >
                                    <Eye className="w-4 h-4" />
                                    Details
                                </button>

                                {rental.status === 'PENDING' && (
                                    <>
                                        <button
                                            onClick={() => showConfirmation(rental.id, 'APPROVED', rental.user?.name)}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => showConfirmation(rental.id, 'REJECTED', rental.user?.name)}
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg"
                                        >
                                            Reject
                                        </button>
                                    </>
                                )}
                                {rental.status === 'APPROVED' && (
                                    <button
                                        onClick={() => showConfirmation(rental.id, 'CHECKED_OUT', rental.user?.name)}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg"
                                    >
                                        Checkout
                                    </button>
                                )}
                                {rental.status === 'CHECKED_OUT' && (
                                    <button
                                        onClick={() => showConfirmation(rental.id, 'RETURNED', rental.user?.name)}
                                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg"
                                    >
                                        Return
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {filteredRentals.length === 0 && (
                    <div className="col-span-full backdrop-blur-2xl bg-slate-900/60 rounded-2xl border border-white/20 p-12 text-center">
                        <ClipboardList className="w-16 h-16 mx-auto mb-4 text-white/30" />
                        <p className="text-white/60 text-lg">No rental requests found for this filter.</p>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedRental && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in" onClick={() => setShowDetailModal(false)} />
                    <div className="relative backdrop-blur-2xl bg-gradient-to-b from-slate-800/95 to-slate-900/95 rounded-3xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-scale-in border border-white/20">
                        {/* Modal Header with Image */}
                        <div className="relative h-48 bg-white flex items-center justify-center">
                            {selectedRental.equipment?.imageUrl ? (
                                <img
                                    src={selectedRental.equipment.imageUrl}
                                    alt={selectedRental.equipment.name}
                                    className="w-full h-full object-contain p-6"
                                />
                            ) : (
                                <Package className="w-20 h-20 text-gray-400" />
                            )}
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <span className={`absolute bottom-3 right-3 px-3 py-1.5 rounded-full text-sm font-bold ${getStatusColor(selectedRental.status)}`}>
                                {getStatusLabel(selectedRental.status)}
                            </span>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-white mb-1">{selectedRental.equipment?.name}</h2>
                            {selectedRental.equipmentItem?.itemCode && (
                                <p className="text-white/60 text-sm mb-4">Item Code: {selectedRental.equipmentItem.itemCode}</p>
                            )}

                            <div className="space-y-4">
                                {/* Requester Info */}
                                <div className="backdrop-blur-xl bg-white/5 rounded-xl p-4 border border-white/10">
                                    <h3 className="text-sm font-semibold text-white/60 mb-2">Requester</h3>
                                    <div className="text-white font-bold text-lg">{selectedRental.user?.name || 'Unknown'}</div>
                                    <div className="text-white/60 text-sm">Student ID: {selectedRental.user?.studentId}</div>
                                </div>

                                {/* Duration Info */}
                                <div className="backdrop-blur-xl bg-white/5 rounded-xl p-4 border border-white/10">
                                    <h3 className="text-sm font-semibold text-white/60 mb-2">Rental Duration</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-xs text-white/50">Start Date</div>
                                            <div className="text-white font-medium">
                                                {new Date(selectedRental.startDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                            <div className="text-white/50 text-xs">
                                                {new Date(selectedRental.startDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-white/50">End Date</div>
                                            <div className="text-white font-medium">
                                                {new Date(selectedRental.endDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                            <div className="text-white/50 text-xs">
                                                {new Date(selectedRental.endDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-center text-blue-400 font-medium text-sm">
                                        📅 Total: {Math.ceil((new Date(selectedRental.endDate).getTime() - new Date(selectedRental.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                                    </div>
                                </div>

                                {/* Request Details */}
                                <div className="backdrop-blur-xl bg-amber-900/20 rounded-xl p-4 border border-amber-500/30">
                                    <h3 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        Request Details / Notes
                                    </h3>
                                    <p className="text-white/80 text-sm whitespace-pre-wrap">
                                        {selectedRental.requestDetails || 'No additional details provided.'}
                                    </p>
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-white/10 hover:bg-white/20 transition-all duration-200 border border-white/20"
                                >
                                    Close
                                </button>
                                {selectedRental.status === 'PENDING' && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setShowDetailModal(false);
                                                showConfirmation(selectedRental.id, 'APPROVED', selectedRental.user?.name);
                                            }}
                                            className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowDetailModal(false);
                                                showConfirmation(selectedRental.id, 'REJECTED', selectedRental.user?.name);
                                            }}
                                            className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg"
                                        >
                                            Reject
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && confirmAction && (() => {
                // Find overlapping PENDING rentals for this action
                const currentRental = rentals.find(r => r.id === confirmAction.id);
                const overlappingPending = confirmAction.status === 'APPROVED' && currentRental
                    ? rentals.filter(r =>
                        r.id !== confirmAction.id &&
                        r.status === 'PENDING' &&
                        r.equipmentItemId === currentRental.equipmentItemId &&
                        isOverlapping(
                            new Date(r.startDate), new Date(r.endDate),
                            new Date(currentRental.startDate), new Date(currentRental.endDate)
                        )
                    )
                    : [];

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in" onClick={() => setShowConfirmModal(false)} />
                        <div className="relative backdrop-blur-2xl bg-gradient-to-b from-slate-800/95 to-slate-900/95 rounded-3xl shadow-2xl max-w-md w-full mx-4 p-6 animate-scale-in border border-white/20">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                                    <AlertTriangle className="h-8 w-8 text-amber-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Confirm Action</h3>
                                <p className="text-white/60">
                                    Are you sure you want to <span className="text-white font-semibold">{getActionLabel(confirmAction.status)}</span>
                                    <br />for <span className="text-white font-semibold">{confirmAction.userName}</span>?
                                </p>

                                {/* Warning for overlapping rentals that will be auto-rejected */}
                                {overlappingPending.length > 0 && (
                                    <div className="mt-4 p-3 bg-orange-900/30 border border-orange-500/50 rounded-xl text-left">
                                        <div className="flex items-center gap-2 text-orange-400 font-semibold text-sm mb-2">
                                            <AlertOctagon className="w-4 h-4" />
                                            Warning: Overlapping requests will be auto-rejected
                                        </div>
                                        <ul className="text-white/70 text-sm space-y-1">
                                            {overlappingPending.map((r: any) => (
                                                <li key={r.id} className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                                                    {r.user?.name || 'Unknown'} ({r.user?.studentId})
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
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
                );
            })()}

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
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
}
