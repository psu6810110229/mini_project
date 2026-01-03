import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, X, Clock, Trash2, Calendar, AlertTriangle, FileText, ShoppingBag, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import apiClient from '../api/client';

interface OverlapInfo {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    userName: string;
}

export default function RentalListButton() {
    const { cartItems, removeFromCart, clearCart } = useCart();
    const [isOpen, setIsOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Date state for rental period
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Reason for rental (mandatory)
    const [rentalReason, setRentalReason] = useState('');

    // Overlap warning state
    const [overlapWarning, setOverlapWarning] = useState<OverlapInfo[] | null>(null);
    const [showOverlapModal, setShowOverlapModal] = useState(false);
    const [checkingOverlap, setCheckingOverlap] = useState(false);

    // Confirmation modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ type: string; itemId?: string } | null>(null);

    // State for countdown timers
    const [, setTick] = useState(0);
    useEffect(() => {
        if (cartItems.length === 0) return;
        const interval = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, [cartItems.length]);

    // Set default dates when opening
    useEffect(() => {
        if (isOpen && !startDate) {
            const now = new Date();
            now.setMinutes(now.getMinutes() + 30);
            const defaultEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

            setStartDate(formatDateTimeLocal(now));
            setEndDate(formatDateTimeLocal(defaultEnd));
        }
    }, [isOpen, startDate]);

    const formatDateTimeLocal = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const formatTimeRemaining = (expiresAt: number) => {
        const remaining = Math.max(0, expiresAt - Date.now());
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const formatDisplayDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const checkForOverlaps = async (): Promise<boolean> => {
        setCheckingOverlap(true);
        setError('');

        try {
            const start = new Date(startDate);
            const end = new Date(endDate);

            for (const item of cartItems) {
                const response = await apiClient.post('/rentals/check-overlap', {
                    equipmentId: item.equipmentId,
                    equipmentItemId: item.itemId,
                    startDate: start.toISOString(),
                    endDate: end.toISOString(),
                });

                if (response.data.hasOverlap) {
                    setOverlapWarning(response.data.overlappingRentals);
                    setShowOverlapModal(true);
                    return true;
                }
            }
            return false;
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to check availability');
            return false;
        } finally {
            setCheckingOverlap(false);
        }
    };

    const handleConfirmClick = async () => {
        if (cartItems.length === 0) return;

        const start = new Date(startDate);
        const end = new Date(endDate);
        const now = new Date();

        if (start < now) {
            setError('Start date cannot be in the past');
            return;
        }

        if (end <= start) {
            setError('End date must be after start date');
            return;
        }

        if (!rentalReason.trim()) {
            setError('Please provide a reason for your rental request');
            return;
        }

        const hasOverlap = await checkForOverlaps();
        if (!hasOverlap) {
            await submitRentals(false);
        }
    };

    const submitRentals = async (allowOverlap: boolean = false) => {
        setSubmitting(true);
        setError('');

        try {
            const start = new Date(startDate);
            const end = new Date(endDate);

            for (const item of cartItems) {
                await apiClient.post('/rentals', {
                    equipmentId: item.equipmentId,
                    equipmentItemId: item.itemId,
                    startDate: start.toISOString(),
                    endDate: end.toISOString(),
                    requestDetails: rentalReason.trim(),
                    allowOverlap: allowOverlap,
                });
            }

            clearCart();
            setRentalReason('');
            setIsOpen(false);
            setShowOverlapModal(false);
            setOverlapWarning(null);
            navigate('/my-rentals');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit rental requests');
        } finally {
            setSubmitting(false);
        }
    };

    const handleProceedAnyway = async () => {
        setShowOverlapModal(false);
        await submitRentals(true);
    };

    const handleChangeDates = () => {
        setShowOverlapModal(false);
        setOverlapWarning(null);
    };

    // Confirmation handlers
    const showConfirmation = (type: string, itemId?: string) => {
        setConfirmAction({ type, itemId });
        setShowConfirmModal(true);
    };

    const handleConfirmedAction = () => {
        if (!confirmAction) return;

        if (confirmAction.type === 'removeItem' && confirmAction.itemId) {
            removeFromCart(confirmAction.itemId);
        } else if (confirmAction.type === 'clearAll') {
            clearCart();
        }

        setShowConfirmModal(false);
        setConfirmAction(null);
    };

    const isConfirmDisabled = submitting || !startDate || !endDate || !rentalReason.trim() || checkingOverlap;

    return (
        <>
            {/* Floating Rental List Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 backdrop-blur-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-4 rounded-2xl shadow-2xl z-40 transition-all duration-300 transform hover:scale-110 border border-white/20 group"
            >
                <ShoppingBag className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                {cartItems.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg animate-bounce">
                        {cartItems.length}
                    </span>
                )}
            </button>

            {/* Rental List Drawer */}
            {isOpen && (
                <div className="fixed inset-0 z-50">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Drawer */}
                    <div className="absolute right-0 top-0 h-full w-full max-w-lg backdrop-blur-2xl bg-gradient-to-b from-slate-900/90 to-slate-800/90 shadow-2xl transform transition-all duration-500 ease-out animate-slide-in-right border-l border-white/10">
                        <div className="flex flex-col h-full">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
                                <div>
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                        <div className="p-2 bg-white/10 rounded-xl">
                                            <ShoppingBag className="h-6 w-6" />
                                        </div>
                                        Rental List
                                    </h2>
                                    <p className="text-white/60 text-sm mt-1">
                                        {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in cart
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-3 hover:bg-white/10 rounded-xl transition-all duration-200 hover:rotate-90"
                                >
                                    <X className="h-6 w-6 text-white/70" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {cartItems.length === 0 ? (
                                    <div className="text-center py-16">
                                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                                            <ShoppingBag className="h-12 w-12 text-white/30" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-white mb-2">Cart is Empty</h3>
                                        <p className="text-white/50">Select equipment from the list to start renting</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Selected Items */}
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider flex items-center gap-2">
                                                <ClipboardList className="w-4 h-4" />
                                                Selected Equipment
                                            </h3>
                                            {cartItems.map((item, index) => (
                                                <div
                                                    key={item.itemId}
                                                    className="group backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all duration-300 animate-fade-in-up"
                                                    style={{ animationDelay: `${index * 100}ms` }}
                                                >
                                                    <div className="flex gap-4 items-center">
                                                        <div className="w-16 h-16 rounded-xl bg-white overflow-hidden flex-shrink-0 shadow-lg">
                                                            {item.equipmentImage ? (
                                                                <img
                                                                    src={item.equipmentImage}
                                                                    alt={item.equipmentName}
                                                                    className="w-full h-full object-contain p-1"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                    <ShoppingBag className="w-6 h-6" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-semibold text-white truncate">{item.equipmentName}</h4>
                                                            <p className="text-sm text-white/50">ID: {item.itemCode}</p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <Clock className="h-3 w-3 text-amber-400" />
                                                                <span className="text-xs font-mono text-amber-400">
                                                                    {formatTimeRemaining(item.expiresAt)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => showConfirmation('removeItem', item.itemId)}
                                                            className="p-3 text-red-400 hover:bg-red-500/20 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100"
                                                            title="Remove"
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Rental Period */}
                                        <div className="backdrop-blur-xl bg-blue-500/10 rounded-2xl p-5 border border-blue-500/20 space-y-4">
                                            <h3 className="font-semibold text-white flex items-center gap-2">
                                                <Calendar className="h-5 w-5 text-blue-400" />
                                                Rental Period
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs text-white/50 mb-2 uppercase tracking-wider">Start</label>
                                                    <input
                                                        type="datetime-local"
                                                        value={startDate}
                                                        onChange={(e) => setStartDate(e.target.value)}
                                                        className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                                                        style={{ colorScheme: 'dark' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-white/50 mb-2 uppercase tracking-wider">End</label>
                                                    <input
                                                        type="datetime-local"
                                                        value={endDate}
                                                        onChange={(e) => setEndDate(e.target.value)}
                                                        className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                                                        style={{ colorScheme: 'dark' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Reason for Rental */}
                                        <div className="backdrop-blur-xl bg-amber-500/10 rounded-2xl p-5 border border-amber-500/20 space-y-3">
                                            <h3 className="font-semibold text-white flex items-center gap-2">
                                                <FileText className="h-5 w-5 text-amber-400" />
                                                Reason for Rental <span className="text-red-400">*</span>
                                            </h3>
                                            <textarea
                                                value={rentalReason}
                                                onChange={(e) => setRentalReason(e.target.value)}
                                                placeholder="e.g., Event recording, Final project, Club activity..."
                                                rows={3}
                                                className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200 resize-none"
                                            />
                                            <p className="text-xs text-white/40">
                                                Admin will consider this reason for approval
                                            </p>
                                        </div>

                                        {error && (
                                            <div className="backdrop-blur-xl bg-red-500/20 text-red-300 rounded-xl p-4 text-sm border border-red-500/30 animate-shake">
                                                ⚠️ {error}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Footer */}
                            {cartItems.length > 0 && (
                                <div className="p-6 border-t border-white/10 bg-gradient-to-t from-slate-900/50 to-transparent space-y-3">
                                    <button
                                        onClick={handleConfirmClick}
                                        disabled={isConfirmDisabled}
                                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
                                    >
                                        {checkingOverlap || submitting ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="h-5 w-5" />
                                                Confirm Rental
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => showConfirmation('clearAll')}
                                        disabled={submitting}
                                        className="w-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white py-3 rounded-xl font-medium transition-all duration-200 border border-white/10"
                                    >
                                        Clear All Items
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Overlap Warning Modal */}
            {showOverlapModal && overlapWarning && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in" onClick={() => setShowOverlapModal(false)} />
                    <div className="relative backdrop-blur-2xl bg-gradient-to-b from-slate-800/95 to-slate-900/95 rounded-3xl shadow-2xl max-w-md w-full mx-4 p-6 animate-scale-in border border-white/20">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-amber-500/20 rounded-2xl">
                                <AlertTriangle className="h-7 w-7 text-amber-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Overlap Detected</h3>
                                <p className="text-sm text-white/60">Someone else has requested this time slot</p>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-2xl p-4 mb-6 max-h-48 overflow-y-auto border border-white/10">
                            {overlapWarning.map((rental, idx) => (
                                <div key={rental.id} className={`${idx > 0 ? 'border-t border-white/10 pt-3 mt-3' : ''}`}>
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-white">{rental.userName}</span>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${rental.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                                                rental.status === 'APPROVED' ? 'bg-blue-500/20 text-blue-400' :
                                                    'bg-green-500/20 text-green-400'
                                            }`}>
                                            {rental.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-white/50 mt-1">
                                        {formatDisplayDate(rental.startDate)} - {formatDisplayDate(rental.endDate)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleChangeDates}
                                className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-white/10 hover:bg-white/20 transition-all duration-200 border border-white/20"
                            >
                                Change Dates
                            </button>
                            <button
                                onClick={handleProceedAnyway}
                                disabled={submitting}
                                className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 transition-all duration-200 shadow-lg disabled:opacity-50"
                            >
                                {submitting ? 'Submitting...' : 'Proceed Anyway'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && confirmAction && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in" onClick={() => setShowConfirmModal(false)} />
                    <div className="relative backdrop-blur-2xl bg-gradient-to-b from-slate-800/95 to-slate-900/95 rounded-3xl shadow-2xl max-w-sm w-full mx-4 p-6 animate-scale-in border border-white/20">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                                <AlertTriangle className="h-8 w-8 text-amber-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Confirm Action</h3>
                            <p className="text-white/60">
                                {confirmAction.type === 'removeItem'
                                    ? 'Are you sure you want to remove this item from the cart?'
                                    : 'Are you sure you want to clear all items?'}
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
                                className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slide-in-right {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    opacity: 0;
                    animation: fade-in-up 0.4s ease-out forwards;
                }
                @keyframes scale-in {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-scale-in {
                    animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.3s ease-in-out;
                }
            `}</style>
        </>
    );
}
