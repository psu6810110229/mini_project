import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import type { Equipment, EquipmentItem } from '../types';
import { UserRole, EquipmentItemStatus } from '../types';
import { useCart } from '../context/CartContext';
import { ClipboardList, Check, Plus } from 'lucide-react';

export default function EquipmentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, isInCart } = useCart();
    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [addedMessage, setAddedMessage] = useState('');

    // Check if user is admin
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isAdmin = user?.role === UserRole.ADMIN;

    useEffect(() => {
        fetchEquipment();
    }, [id]);

    const fetchEquipment = async () => {
        try {
            const response = await apiClient.get<Equipment>(`/equipments/${id}`);
            setEquipment(response.data);
        } catch (err) {
            setError('Failed to load equipment details');
        } finally {
            setLoading(false);
        }
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
            setAddedMessage(`Item ${item.itemCode} added to rental list!`);
            setTimeout(() => setAddedMessage(''), 2000);
        }
    };

    const availableItems = equipment?.items?.filter(
        item => item.status === EquipmentItemStatus.AVAILABLE && !isInCart(item.id)
    ) || [];

    const inCartItems = equipment?.items?.filter(item => isInCart(item.id)) || [];

    if (loading) return <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center"><div className="text-gray-700">Loading...</div></div>;
    if (error || !equipment) return <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center"><div className="text-red-600">{error || 'Equipment not found'}</div></div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <div className="p-8 max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/equipments')}
                    className="mb-8 text-gray-700 hover:text-gray-900 flex items-center gap-2 font-semibold transition-colors"
                >
                    ← Back to List
                </button>

                {/* Success Message */}
                {addedMessage && (
                    <div className="mb-6 flex gap-3 bg-green-50 border border-green-200 rounded-xl p-4 shadow-lg animate-slide-in">
                        <Check className="h-5 w-5 text-green-700 flex-shrink-0" />
                        <p className="text-green-700 font-semibold">{addedMessage}</p>
                    </div>
                )}

                <div className="bg-white/60 backdrop-blur-md rounded-2xl overflow-hidden border border-gray-300/40 shadow-lg animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* Image Section - White Background */}
                        <div className="h-64 md:h-auto bg-white flex items-center justify-center border-b md:border-b-0 md:border-r border-gray-100">
                            {equipment.imageUrl ? (
                                <img
                                    src={equipment.imageUrl}
                                    alt={equipment.name}
                                    className="w-full h-full object-contain p-8"
                                />
                            ) : (
                                <span className="text-gray-500 text-lg">No Image Available</span>
                            )}
                        </div>

                        {/* Details Section */}
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{equipment.name}</h1>
                                    <span className="text-gray-600 bg-gray-200/60 px-3 py-1 rounded-full text-sm font-semibold">
                                        {equipment.category}
                                    </span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${equipment.status === 'AVAILABLE'
                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                    : 'bg-red-100 text-red-700 border border-red-200'
                                    }`}>
                                    {equipment.status}
                                </span>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between py-3 border-b border-gray-300">
                                    <span className="text-gray-600">Available Items</span>
                                    <span className="text-gray-900 font-semibold">
                                        {availableItems.length}/{equipment.items?.length || equipment.stockQty} units
                                    </span>
                                </div>
                            </div>

                            {!isAdmin && (
                                <>
                                    {/* Available Items to Add */}
                                    {availableItems.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Select an Item to Rent</h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                {availableItems.map((item, index) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => handleAddToCart(item)}
                                                        className="flex items-center justify-between bg-white border border-gray-200 hover:border-gray-400 rounded-xl p-3 transition-all duration-200 hover:shadow-md animate-fade-in group"
                                                        style={{ animationDelay: `${index * 50}ms` }}
                                                    >
                                                        <div className="text-left">
                                                            <span className="font-bold text-gray-900">ID: {item.itemCode}</span>
                                                            <span className="block text-xs text-green-600 font-medium">Available</span>
                                                        </div>
                                                        <div className="bg-gray-100 group-hover:bg-gray-700 group-hover:text-white p-2 rounded-lg transition-colors">
                                                            <Plus className="h-4 w-4" />
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Items Already in Cart */}
                                    {inCartItems.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                <ClipboardList className="h-5 w-5" />
                                                In Your Rental List
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                {inCartItems.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3"
                                                    >
                                                        <div className="text-left">
                                                            <span className="font-bold text-gray-900">ID: {item.itemCode}</span>
                                                            <span className="block text-xs text-green-600 font-medium">Reserved</span>
                                                        </div>
                                                        <div className="bg-green-100 text-green-700 p-2 rounded-lg">
                                                            <Check className="h-4 w-4" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* No Items Available */}
                                    {availableItems.length === 0 && inCartItems.length === 0 && (
                                        <div className="bg-gray-100/70 backdrop-blur p-6 rounded-xl border border-gray-300 text-center">
                                            <p className="text-gray-600 font-medium">
                                                😔 No items available for rent at the moment
                                            </p>
                                        </div>
                                    )}

                                    {/* Rental List Hint */}
                                    {inCartItems.length > 0 && (
                                        <p className="text-sm text-gray-500 text-center">
                                            Click the rental list button at the bottom right to confirm your rental
                                        </p>
                                    )}
                                </>
                            )}

                            {isAdmin && (
                                <div className="bg-gray-100/70 backdrop-blur p-6 rounded-xl border border-gray-300">
                                    <p className="text-center text-gray-600 font-medium">
                                        👨‍💼 Admin View Only - Rental functionality is disabled
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

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
            `}</style>
        </div>
    );
}
