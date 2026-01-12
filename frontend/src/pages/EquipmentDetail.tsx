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
import { ArrowLeft } from 'lucide-react';
import { LoadingSpinner } from '../components/ui';
import EquipmentImage from '../components/equipment/EquipmentImage';
import EquipmentRentalActions, { type ActiveRental } from '../components/equipment/EquipmentRentalActions';

export default function EquipmentDetail() {
    // ===== HOOKS =====
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, isInCart, removeFromCart } = useCart();

    // ===== STATE =====
    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [activeRentals, setActiveRentals] = useState<ActiveRental[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [addedMessage, setAddedMessage] = useState('');

    // Check if user is admin
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isAdmin = user?.role === UserRole.ADMIN;

    // ===== FETCH DATA =====
    useEffect(() => {
        const fetchEquipment = async () => {
            try {
                const [equipmentRes, rentalsRes] = await Promise.all([
                    apiClient.get<Equipment>(`/equipments/${id}`),
                    apiClient.get<ActiveRental[]>(`/rentals/equipment/${id}/active`).catch(() => ({ data: [] })),
                ]);
                setEquipment(equipmentRes.data);
                setActiveRentals(rentalsRes.data);
            } catch (err) {
                setError('โหลดรายละเอียดไม่สำเร็จ');
            } finally {
                setLoading(false);
            }
        };
        fetchEquipment();
    }, [id]);

    // ===== HELPER FUNCTIONS =====
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('th-TH-u-ca-buddhist', { month: 'short', day: 'numeric', year: 'numeric' });

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
            setAddedMessage(`เพิ่ม ${item.itemCode} แล้ว!`);
            setTimeout(() => setAddedMessage(''), 2000);
        }
    };

    // ===== COMPUTED VALUES =====
    const availableItemsForCart = equipment?.items?.filter(item => item.status === EquipmentItemStatus.AVAILABLE && !isInCart(item.id)) || [];
    const actualAvailableItems = equipment?.items?.filter(item => item.status === EquipmentItemStatus.AVAILABLE) || [];
    const inCartItems = equipment?.items?.filter(item => isInCart(item.id)) || [];

    // ===== CONDITIONAL RENDERING =====
    if (loading) return <LoadingSpinner message="กำลังโหลด..." />;
    if (error || !equipment) return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="backdrop-blur-2xl bg-red-900/50 rounded-2xl p-8 border border-red-500/30">
                <p className="text-red-200">{error || 'ไม่พบอุปกรณ์นี้'}</p>
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            {/* Back Button */}
            <button onClick={() => navigate('/equipments')} className="mb-8 text-white hover:text-white/80 flex items-center gap-2 font-semibold group" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform" /> กลับ
            </button>

            {/* Main Card */}
            <div className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl overflow-hidden border border-white/20 shadow-xl animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2">

                    {/* Left: Image Section */}
                    <EquipmentImage equipment={equipment} addedMessage={addedMessage} />

                    {/* Right: Details & Actions */}
                    <div className="p-6 md:p-8">
                        {/* Header Info */}
                        <div className="mb-4">
                            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{equipment.name}</h1>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-white/70 bg-white/10 px-3 py-1 rounded-full text-sm font-medium border border-white/20">{equipment.category}</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-bold ${equipment.status === 'AVAILABLE' && actualAvailableItems.length > 0 ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                                    {equipment.status === 'AVAILABLE' && actualAvailableItems.length > 0 ? 'ว่างอยู่' : 'ไม่ว่าง'}
                                </span>
                            </div>
                        </div>

                        {/* Availability Count */}
                        <div className="flex justify-between py-3 border-b border-white/20 mb-6">
                            <span className="text-white/70">พร้อมใช้</span>
                            <span className="text-white font-semibold">{equipment.status === 'AVAILABLE' ? actualAvailableItems.length : 0}/{equipment.items?.length || equipment.stockQty}</span>
                        </div>

                        {/* Rental Actions (Selection, Lists, Admin msg) */}
                        <EquipmentRentalActions
                            isAdmin={isAdmin}
                            availableItemsForCart={availableItemsForCart}
                            inCartItems={inCartItems}
                            activeRentals={activeRentals}
                            onAddToCart={handleAddToCart}
                            onRemoveFromCart={removeFromCart}
                            formatDate={formatDate}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

