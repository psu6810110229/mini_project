import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, X, Clock, Trash2, Calendar } from 'lucide-react';
import { useCart } from '../context/CartContext';
import apiClient from '../api/client';

export default function RentalListButton() {
    const { cartItems, removeFromCart, clearCart } = useCart();
    const [isOpen, setIsOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Date state for rental period
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

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
            now.setMinutes(now.getMinutes() + 30); // Start 30 minutes from now
            const defaultEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days later

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

    const handleConfirmRentals = async () => {
        if (cartItems.length === 0) return;

        // Validate dates
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

        setSubmitting(true);
        setError('');

        try {
            // Create rental for each item
            for (const item of cartItems) {
                await apiClient.post('/rentals', {
                    equipmentId: item.equipmentId,
                    equipmentItemId: item.itemId,
                    startDate: start.toISOString(),
                    endDate: end.toISOString(),
                    requestDetails: `Rental request for ${item.equipmentName} (Item: ${item.itemCode})`,
                });
            }

            clearCart();
            setIsOpen(false);
            navigate('/my-rentals');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit rental requests');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            {/* Floating Rental List Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white p-4 rounded-full shadow-2xl z-40 transition-all duration-300 transform hover:scale-110"
            >
                <ClipboardList className="h-6 w-6" />
                {cartItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                        {cartItems.length}
                    </span>
                )}
            </button>

            {/* Rental List Drawer */}
            {isOpen && (
                <div className="fixed inset-0 z-50">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Drawer */}
                    <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-out animate-slide-in-right">
                        <div className="flex flex-col h-full">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-100 to-gray-50">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <ClipboardList className="h-5 w-5" />
                                    Rental List ({cartItems.length})
                                </h2>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    <X className="h-5 w-5 text-gray-600" />
                                </button>
                            </div>

                            {/* Confirm Button at Top - More Visible */}
                            {cartItems.length > 0 && (
                                <div className="p-4 bg-green-50 border-b border-green-200">
                                    <button
                                        onClick={handleConfirmRentals}
                                        disabled={submitting || !startDate || !endDate}
                                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 text-white py-4 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                                    >
                                        {submitting ? 'Processing...' : '✓ Confirm Your Rental'}
                                    </button>
                                </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {cartItems.length === 0 ? (
                                    <div className="text-center text-gray-500 py-12">
                                        <ClipboardList className="h-16 w-16 mx-auto mb-4 opacity-30" />
                                        <p>Your rental list is empty</p>
                                        <p className="text-sm mt-2">Add equipment items to get started</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Rental Period Selection */}
                                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                <Calendar className="h-5 w-5 text-blue-600" />
                                                Rental Period
                                            </h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm text-gray-700 mb-1 font-medium">Start Date & Time</label>
                                                    <input
                                                        type="datetime-local"
                                                        value={startDate}
                                                        onChange={(e) => setStartDate(e.target.value)}
                                                        className="w-full bg-white border border-gray-300 rounded-lg p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-gray-700 mb-1 font-medium">End Date & Time</label>
                                                    <input
                                                        type="datetime-local"
                                                        value={endDate}
                                                        onChange={(e) => setEndDate(e.target.value)}
                                                        className="w-full bg-white border border-gray-300 rounded-lg p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Items List */}
                                        <h3 className="font-bold text-gray-900">Selected Items</h3>
                                        {cartItems.map((item) => (
                                            <div
                                                key={item.itemId}
                                                className="bg-gray-50 rounded-xl p-4 border border-gray-200 animate-fade-in"
                                            >
                                                <div className="flex gap-4">
                                                    {item.equipmentImage ? (
                                                        <img
                                                            src={item.equipmentImage}
                                                            alt={item.equipmentName}
                                                            className="w-16 h-16 object-contain rounded-lg bg-white border border-gray-200"
                                                        />
                                                    ) : (
                                                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                                                            No Image
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-gray-900 truncate">{item.equipmentName}</h3>
                                                        <p className="text-sm text-gray-600">Item ID: {item.itemCode}</p>
                                                        <div className="flex items-center gap-1 mt-2 text-amber-600">
                                                            <Clock className="h-4 w-4" />
                                                            <span className="text-sm font-medium">
                                                                Reserved for {formatTimeRemaining(item.expiresAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFromCart(item.itemId)}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors self-start"
                                                        title="Remove from list"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {error && (
                                    <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
                                        {error}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {cartItems.length > 0 && (
                                <div className="p-4 border-t border-gray-200">
                                    <button
                                        onClick={clearCart}
                                        disabled={submitting}
                                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-colors"
                                    >
                                        Clear All Items
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
        </>
    );
}
