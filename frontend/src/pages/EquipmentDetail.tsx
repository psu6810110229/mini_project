import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import type { Equipment, EquipmentItem } from '../types';
import { UserRole, EquipmentItemStatus } from '../types';
import { useCart } from '../context/CartContext';
import { ClipboardList, Check, Plus, X, ArrowLeft, Package, ShoppingBag, AlertTriangle, Calendar, Clock } from 'lucide-react';

interface ActiveRental {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    equipmentItemId: string;
    itemCode: string;
    userName: string;
}

export default function EquipmentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, isInCart, removeFromCart } = useCart();
    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [activeRentals, setActiveRentals] = useState<ActiveRental[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [addedMessage, setAddedMessage] = useState('');

    // Confirmation modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ type: string; itemId: string; itemCode: string } | null>(null);

    // Check if user is admin
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isAdmin = user?.role === UserRole.ADMIN;

    useEffect(() => {
        fetchEquipment();
    }, [id]);

    const fetchEquipment = async () => {
        try {
            const [equipmentRes, rentalsRes] = await Promise.all([
                apiClient.get<Equipment>(`/equipments/${id}`),
                apiClient.get<ActiveRental[]>(`/rentals/equipment/${id}/active`).catch(() => ({ data: [] })),
            ]);
            setEquipment(equipmentRes.data);
            setActiveRentals(rentalsRes.data);
        } catch (err) {
            setError('Failed to load equipment details');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const handleAddToCart = (item: EquipmentItem) => {
        if (!equipment) return;

        const success = addToCart({
            equipmentId: equipment.id,
            equipmentName: equipment.name,
            equipmentImage: equipment.imageUrl,
            itemId: item.id,
            itemCode: item.itemCode,
        });

        if (success) {
            setAddedMessage(`Add ${item.itemCode} to the list!`);
            setTimeout(() => setAddedMessage(''), 2000);
        }
    };

    const showRemoveConfirmation = (itemId: string, itemCode: string) => {
        setConfirmAction({ type: 'remove', itemId, itemCode });
        setShowConfirmModal(true);
    };

    const handleConfirmedRemove = () => {
        if (confirmAction) {
            removeFromCart(confirmAction.itemId);
            setShowConfirmModal(false);
            setConfirmAction(null);
        }
    };

    // Available items for adding to cart - exclude items already in cart for UI purposes
    const availableItemsForCart = equipment?.items?.filter(
        item => item.status === EquipmentItemStatus.AVAILABLE && !isInCart(item.id)
    ) || [];

    // Actual available count for display - only based on item status, not cart
    const actualAvailableItems = equipment?.items?.filter(
        item => item.status === EquipmentItemStatus.AVAILABLE
    ) || [];

    const inCartItems = equipment?.items?.filter(item => isInCart(item.id)) || [];

    if (loading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl p-8 border border-white/20 shadow-xl">
                    <div className="flex items-center gap-3">
                        <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-white font-medium">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !equipment) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="backdrop-blur-2xl bg-red-900/50 rounded-2xl p-8 border border-red-500/30 shadow-xl">
                    <p className="text-red-200 font-medium">{error || 'ไม่พบอุปกรณ์'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <button
                onClick={() => navigate('/equipments')}
                className="mb-8 text-white hover:text-white/80 flex items-center gap-2 font-semibold transition-all duration-200 group"
                style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform duration-200" />
                Back to list
            </button>

            {/* Equipment Card */}
            <div className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl overflow-hidden border border-white/20 shadow-xl animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Image Section - White background */}
                    <div className="relative h-64 md:h-auto bg-white flex items-center justify-center border-b md:border-b-0 md:border-r border-white/10 overflow-hidden">
                        {equipment.imageUrl ? (
                            <img
                                src={equipment.imageUrl}
                                alt={equipment.name}
                                className="w-full h-full object-contain p-8 hover:scale-110 transition-transform duration-500"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-400">
                                <Package className="w-16 h-16" />
                                <span className="text-sm">No Image</span>
                            </div>
                        )}
                        {/* Success Message Overlay */}
                        {addedMessage && (
                            <div className="absolute bottom-4 left-4 right-4 flex gap-2 items-center backdrop-blur-xl bg-green-600/90 rounded-xl px-4 py-3 shadow-lg animate-slide-in">
                                <Check className="h-5 w-5 text-white flex-shrink-0" />
                                <p className="text-white font-semibold text-sm">{addedMessage}</p>
                            </div>
                        )}
                    </div>

                    {/* Details Section */}
                    <div className="p-6 md:p-8">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{equipment.name}</h1>
                                <span className="text-white/70 backdrop-blur-xl bg-white/10 px-3 py-1 rounded-full text-sm font-medium border border-white/20">
                                    {equipment.category}
                                </span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${actualAvailableItems.length > 0
                                ? 'bg-green-600 text-white'
                                : 'bg-red-600 text-white'
                                }`}>
                                {actualAvailableItems.length > 0 ? 'Available' : 'Unavailable'}
                            </span>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between py-3 border-b border-white/20">
                                <span className="text-white/70">Available</span>
                                <span className="text-white font-semibold">
                                    {actualAvailableItems.length}/{equipment.items?.length || equipment.stockQty}
                                </span>
                            </div>
                        </div>

                        {!isAdmin && (
                            <>
                                {/* Available Items to Add */}
                                {availableItemsForCart.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold text-white mb-3">Select items to rent</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {availableItemsForCart.map((item, index) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => handleAddToCart(item)}
                                                    className="flex items-center justify-between backdrop-blur-2xl bg-slate-800/50 border border-white/20 hover:border-blue-500/50 rounded-xl p-3 transition-all duration-300 hover:bg-slate-700/50 hover:scale-[1.02] group animate-fade-in"
                                                    style={{ animationDelay: `${index * 50}ms` }}
                                                >
                                                    <div className="text-left">
                                                        <span className="font-bold text-white">Item: {item.itemCode}</span>
                                                        <span className="block text-xs text-green-400 font-medium">Available</span>
                                                    </div>
                                                    <div className="backdrop-blur-xl bg-white/10 group-hover:bg-blue-600 p-2 rounded-lg transition-all duration-300 group-hover:scale-110">
                                                        <Plus className="h-4 w-4 text-white" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Items Already in Cart */}
                                {inCartItems.length > 0 && (
                                    <div className="mb-6 mt-4">
                                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                            <ShoppingBag className="h-5 w-5" />
                                            Items in your rental list
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {inCartItems.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center justify-between backdrop-blur-2xl bg-green-900/30 border border-green-500/30 rounded-xl p-3 animate-fade-in"
                                                >
                                                    <div className="text-left">
                                                        <span className="font-bold text-white">Item: {item.itemCode}</span>
                                                        <span className="block text-xs text-green-300 font-medium">Reserved</span>
                                                    </div>
                                                    <button
                                                        onClick={() => showRemoveConfirmation(item.id, item.itemCode)}
                                                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-all duration-200 hover:scale-110"
                                                        title="Remove from list"
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
                                        <p className="text-white/70 font-medium">
                                            No available items to rent at the moment
                                        </p>
                                    </div>
                                )}

                                {/* Currently Rented Items */}
                                {activeRentals.length > 0 && (
                                    <div className="mt-6">
                                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                            <Clock className="h-5 w-5 text-amber-400" />
                                            Currently Rented Items
                                        </h3>
                                        <div className="space-y-2">
                                            {activeRentals.map((rental) => (
                                                <div
                                                    key={rental.id}
                                                    className="flex items-center justify-between backdrop-blur-2xl bg-amber-900/20 border border-amber-500/30 rounded-xl p-3 animate-fade-in"
                                                >
                                                    <div className="text-left">
                                                        <span className="font-bold text-white">Item: {rental.itemCode}</span>
                                                        <span className="block text-xs text-amber-300 font-medium capitalize">
                                                            {rental.status.toLowerCase().replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    <div className="text-right text-sm">
                                                        <div className="flex items-center gap-1 text-white/70">
                                                            <Calendar className="h-3 w-3" />
                                                            <span>{formatDate(rental.startDate)}</span>
                                                        </div>
                                                        <div className="text-white/50 text-xs">to {formatDate(rental.endDate)}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Rental List Hint */}
                                {inCartItems.length > 0 && (
                                    <p className="text-sm text-white/60 text-center flex items-center justify-center gap-2">
                                        <ShoppingBag className="w-4 h-4" />
                                        Click the rental list button in the bottom right to confirm
                                    </p>
                                )}
                            </>
                        )}

                        {isAdmin && (
                            <div className="backdrop-blur-2xl bg-slate-800/50 p-6 rounded-xl border border-white/20">
                                <p className="text-center text-white/70 font-medium">
                                    👨‍💼 Admin mode - Cannot rent equipment
                                </p>
                            </div>
                        )}
                    </div>
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
                            <h3 className="text-xl font-bold text-white mb-2">Confirm removal</h3>
                            <p className="text-white/60">
                                Are you sure you want to remove <span className="text-white font-semibold">{confirmAction.itemCode}</span> from your rental list?
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
                                onClick={handleConfirmedRemove}
                                className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    opacity: 0;
                    animation: fade-in 0.4s ease-out forwards;
                }
                @keyframes slide-in {
                    from { opacity: 0; transform: translateX(-20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out forwards;
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
