/**
 * EquipmentDetail Page
 * 
 * Shows detailed view of a single equipment item.
 * Users can select specific items to add to their rental cart.
 * 
 * KEY CONCEPTS:
 * 1. useParams - Gets URL parameters (like equipment ID)
 * 2. useNavigate - Programmatic navigation
 * 3. Cart Context - Global state for rental cart
 * 
 * URL PATTERN: /equipments/:id
 *   Example: /equipments/abc123 → id = "abc123"
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import type { Equipment, EquipmentItem } from '../types';
import { UserRole, EquipmentItemStatus } from '../types';
import { useCart } from '../context/CartContext';
import { Check, Plus, X, ArrowLeft, Package, ShoppingBag, Calendar, Clock } from 'lucide-react';
import { LoadingSpinner, ConfirmModal } from '../components/ui';

// Type for active rentals - shows who is currently renting each item
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
    // ===== HOOKS =====
    const { id } = useParams();  // Get equipment ID from URL
    const navigate = useNavigate();  // For navigation
    const { addToCart, isInCart, removeFromCart } = useCart();  // Cart functions

    // ===== STATE =====
    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [activeRentals, setActiveRentals] = useState<ActiveRental[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [addedMessage, setAddedMessage] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ itemId: string; itemCode: string } | null>(null);

    // Check if user is admin
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isAdmin = user?.role === UserRole.ADMIN;

    // ===== FETCH DATA =====
    useEffect(() => {
        const fetchEquipment = async () => {
            try {
                // Promise.all - fetch multiple requests simultaneously (faster!)
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
        fetchEquipment();
    }, [id]);

    // ===== HELPER FUNCTIONS =====
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    /**
     * Adds an item to the rental cart
     * Shows success message for 2 seconds
     */
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
            setAddedMessage(`Added ${item.itemCode} to list!`);
            setTimeout(() => setAddedMessage(''), 2000);  // Clear after 2 seconds
        }
    };

    // ===== COMPUTED VALUES =====
    // Items available to add (not already in cart)
    const availableItemsForCart = equipment?.items?.filter(item => item.status === EquipmentItemStatus.AVAILABLE && !isInCart(item.id)) || [];
    // All available items (for display count)
    const actualAvailableItems = equipment?.items?.filter(item => item.status === EquipmentItemStatus.AVAILABLE) || [];
    // Items already in cart
    const inCartItems = equipment?.items?.filter(item => isInCart(item.id)) || [];

    // ===== CONDITIONAL RENDERING =====
    if (loading) return <LoadingSpinner message="Loading equipment..." />;
    if (error || !equipment) return <div className="min-h-[80vh] flex items-center justify-center"><div className="backdrop-blur-2xl bg-red-900/50 rounded-2xl p-8 border border-red-500/30"><p className="text-red-200">{error || 'Equipment not found'}</p></div></div>;

    // ===== MAIN RENDER =====
    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            {/* Back Button */}
            <button onClick={() => navigate('/equipments')} className="mb-8 text-white hover:text-white/80 flex items-center gap-2 font-semibold group" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform" />Back to list
            </button>

            {/* Main Card */}
            <div className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl overflow-hidden border border-white/20 shadow-xl animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Image Section */}
                    <div className="relative h-64 md:h-auto bg-white flex items-center justify-center border-b md:border-b-0 md:border-r border-white/10">
                        {equipment.imageUrl ? (
                            <img src={equipment.imageUrl} alt={equipment.name} className="w-full h-full object-contain p-8 hover:scale-110 transition-transform duration-500" />
                        ) : (
                            <Package className="w-16 h-16 text-gray-400" />
                        )}
                        {/* Success Message Toast */}
                        {addedMessage && (
                            <div className="absolute bottom-4 left-4 right-4 flex gap-2 items-center backdrop-blur-xl bg-green-600/90 rounded-xl px-4 py-3 shadow-lg animate-slide-in">
                                <Check className="h-5 w-5 text-white" /><p className="text-white font-semibold text-sm">{addedMessage}</p>
                            </div>
                        )}
                    </div>

                    {/* Details Section */}
                    <div className="p-6 md:p-8">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{equipment.name}</h1>
                                <span className="text-white/70 bg-white/10 px-3 py-1 rounded-full text-sm font-medium border border-white/20">{equipment.category}</span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${actualAvailableItems.length > 0 ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                                {actualAvailableItems.length > 0 ? 'Available' : 'Unavailable'}
                            </span>
                        </div>

                        {/* Availability Count */}
                        <div className="flex justify-between py-3 border-b border-white/20 mb-6">
                            <span className="text-white/70">Available</span>
                            <span className="text-white font-semibold">{actualAvailableItems.length}/{equipment.items?.length || equipment.stockQty}</span>
                        </div>

                        {/* User View - Item Selection */}
                        {!isAdmin && (<>
                            {/* Items Available to Add */}
                            {availableItemsForCart.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-white mb-3">Select items to rent</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {availableItemsForCart.map((item, i) => (
                                            <button key={item.id} onClick={() => handleAddToCart(item)} className="flex items-center justify-between backdrop-blur-2xl bg-slate-800/50 border border-white/20 hover:border-blue-500/50 rounded-xl p-3 transition-all hover:bg-slate-700/50 hover:scale-[1.02] group animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                                                <div className="text-left"><span className="font-bold text-white">Item: {item.itemCode}</span><span className="block text-xs text-green-400 font-medium">Available</span></div>
                                                <div className="backdrop-blur-xl bg-white/10 group-hover:bg-blue-600 p-2 rounded-lg transition-all group-hover:scale-110"><Plus className="h-4 w-4 text-white" /></div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Items Already in Cart */}
                            {inCartItems.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><ShoppingBag className="h-5 w-5" />In your rental list</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {inCartItems.map(item => (
                                            <div key={item.id} className="flex items-center justify-between backdrop-blur-2xl bg-green-900/30 border border-green-500/30 rounded-xl p-3">
                                                <div className="text-left"><span className="font-bold text-white">Item: {item.itemCode}</span><span className="block text-xs text-green-300 font-medium">Reserved</span></div>
                                                <button onClick={() => { setConfirmAction({ itemId: item.id, itemCode: item.itemCode }); setShowConfirmModal(true); }} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-all hover:scale-110"><X className="h-4 w-4" /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* No Items Available */}
                            {availableItemsForCart.length === 0 && inCartItems.length === 0 && (
                                <div className="backdrop-blur-2xl bg-slate-800/50 p-6 rounded-xl border border-white/20 text-center">
                                    <Package className="w-12 h-12 mx-auto mb-3 text-white/40" /><p className="text-white/70 font-medium">No available items to rent</p>
                                </div>
                            )}

                            {/* Currently Rented Items */}
                            {activeRentals.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><Clock className="h-5 w-5 text-amber-400" />Currently Rented ({activeRentals.length})</h3>
                                    <div className="space-y-3">
                                        {activeRentals.map(rental => (
                                            <div key={rental.id} className="backdrop-blur-2xl bg-amber-900/20 border border-amber-500/30 rounded-xl p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div><span className="font-bold text-white">Item: {rental.itemCode}</span><span className="px-2 py-0.5 ml-2 rounded-full text-xs font-medium bg-amber-500/30 text-amber-300">{rental.status.toLowerCase().replace('_', ' ')}</span><div className="text-sm text-white/70 mt-1">Borrowed by: <span className="text-white font-medium">{rental.userName || 'Unknown'}</span></div></div>
                                                    <div className="text-right text-sm"><div className="flex items-center gap-1 text-white"><Calendar className="h-3.5 w-3.5" />{formatDate(rental.startDate)}</div><div className="text-white/50 text-xs">to {formatDate(rental.endDate)}</div></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Cart Hint */}
                            {inCartItems.length > 0 && <p className="text-sm text-white/60 text-center mt-4 flex items-center justify-center gap-2"><ShoppingBag className="w-4 h-4" />Click the rental list button at bottom-right to confirm</p>}
                        </>)}

                        {/* Admin View */}
                        {isAdmin && (
                            <div className="backdrop-blur-2xl bg-slate-800/50 p-6 rounded-xl border border-white/20"><p className="text-center text-white/70 font-medium">👨‍💼 Admin mode - Cannot rent equipment</p></div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirm Remove Modal */}
            <ConfirmModal isOpen={showConfirmModal} title="Remove from list?" message={`Remove ${confirmAction?.itemCode} from your rental list?`} variant="warning" confirmLabel="Remove" onConfirm={() => { if (confirmAction) removeFromCart(confirmAction.itemId); setShowConfirmModal(false); setConfirmAction(null); }} onCancel={() => { setShowConfirmModal(false); setConfirmAction(null); }} />
        </div>
    );
}
