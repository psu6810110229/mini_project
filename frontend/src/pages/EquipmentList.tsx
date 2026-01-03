import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import type { Equipment } from '../types';
import { UserRole, EquipmentItemStatus } from '../types';
import { Search, Filter, Package } from 'lucide-react';

export default function EquipmentList() {
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [searchName, setSearchName] = useState('');

    // Check if user is admin
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isAdmin = user?.role === UserRole.ADMIN;

    useEffect(() => {
        fetchEquipments();
    }, []);

    const fetchEquipments = async () => {
        try {
            const response = await apiClient.get<Equipment[]>('/equipments');
            const allEquipments = response.data;
            const equipmentsToShow = isAdmin ? allEquipments : allEquipments.filter(item => item.status === 'AVAILABLE');
            setEquipments(equipmentsToShow);
            setFilteredEquipments(equipmentsToShow);
        } catch (err) {
            setError('Failed to load equipments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let filtered = [...equipments];
        if (filterStatus) {
            if (isAdmin) {
                filtered = filtered.filter(item => item.status === filterStatus);
            } else {
                if (filterStatus === 'HAS_AVAILABLE') {
                    filtered = filtered.filter(item => getAvailableCount(item) > 0);
                } else if (filterStatus === 'NO_AVAILABLE') {
                    filtered = filtered.filter(item => getAvailableCount(item) === 0);
                }
            }
        }
        if (filterCategory) {
            filtered = filtered.filter(item => item.category.toLowerCase().includes(filterCategory.toLowerCase()));
        }
        if (searchName) {
            filtered = filtered.filter(item => item.name.toLowerCase().includes(searchName.toLowerCase()));
        }
        setFilteredEquipments(filtered);
    }, [equipments, filterStatus, filterCategory, searchName, isAdmin]);

    const getAvailableCount = (equipment: Equipment) => {
        if (!equipment.items) return equipment.stockQty;
        return equipment.items.filter(i => i.status === EquipmentItemStatus.AVAILABLE).length;
    };

    const getTotalCount = (equipment: Equipment) => {
        return equipment.items?.length || equipment.stockQty;
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
                        <span className="text-white font-medium">Loading equipment...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="backdrop-blur-2xl bg-red-900/50 rounded-2xl p-8 border border-red-500/30 shadow-xl">
                    <p className="text-red-200 font-medium">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-8" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>
                Available Equipment
            </h1>

            {/* Filters */}
            {!loading && equipments.length > 0 && (
                <div className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl border border-white/20 shadow-xl p-4 md:p-6 mb-8 transition-all duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="group">
                            <label className="block text-sm font-semibold text-white mb-2 transition-colors group-focus-within:text-blue-400">
                                <Search className="inline w-4 h-4 mr-1" /> Search Name
                            </label>
                            <input
                                type="text"
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                placeholder="Search by name..."
                                className="w-full backdrop-blur-xl bg-slate-800/60 border border-white/20 rounded-xl py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                            />
                        </div>
                        <div className="group">
                            <label className="block text-sm font-semibold text-white mb-2 transition-colors group-focus-within:text-blue-400">
                                <Filter className="inline w-4 h-4 mr-1" /> Filter by Category
                            </label>
                            <input
                                type="text"
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                placeholder="Filter by category..."
                                className="w-full backdrop-blur-xl bg-slate-800/60 border border-white/20 rounded-xl py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                            />
                        </div>
                        <div className="group">
                            <label className="block text-sm font-semibold text-white mb-2">Filter by Availability</label>
                            <div className="relative">
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="w-full backdrop-blur-xl bg-slate-800/60 border border-white/20 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 cursor-pointer appearance-none"
                                    style={{ colorScheme: 'dark' }}
                                >
                                    <option value="" className="bg-slate-800">All Equipment</option>
                                    {isAdmin ? (
                                        <>
                                            <option value="AVAILABLE" className="bg-slate-800">✓ AVAILABLE</option>
                                            <option value="MAINTENANCE" className="bg-slate-800">⚙ MAINTENANCE</option>
                                            <option value="UNAVAILABLE" className="bg-slate-800">✗ UNAVAILABLE</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="HAS_AVAILABLE" className="bg-slate-800">✓ Has Available Items</option>
                                            <option value="NO_AVAILABLE" className="bg-slate-800">✗ No Available Items</option>
                                        </>
                                    )}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Equipment Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEquipments.map((item, index) => {
                    const availableCount = getAvailableCount(item);
                    const totalCount = getTotalCount(item);
                    const hasAvailable = availableCount > 0;

                    return (
                        <Link
                            key={item.id}
                            to={`/equipments/${item.id}`}
                            className="group backdrop-blur-2xl bg-slate-900/60 rounded-2xl overflow-hidden hover:transform hover:scale-[1.02] transition-all duration-300 border border-white/20 hover:border-white/40 shadow-xl hover:shadow-2xl animate-fade-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {/* Image with white background */}
                            <div className="h-48 bg-white flex items-center justify-center border-b border-white/10 overflow-hidden">
                                {item.imageUrl ? (
                                    <img
                                        src={item.imageUrl}
                                        alt={item.name}
                                        className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/f8f8f8/cccccc?text=No+Image';
                                        }}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-gray-400">
                                        <Package className="w-12 h-12" />
                                        <span className="text-sm">No Image</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <h2 className="text-xl font-semibold text-white group-hover:text-white/90 transition-colors">{item.name}</h2>
                                </div>

                                <p className="text-white/70 text-sm mb-4">{item.category}</p>

                                <div className="flex justify-between items-center text-sm">
                                    <span className={`font-bold transition-colors ${hasAvailable ? 'text-green-400' : 'text-red-400'}`}>
                                        {availableCount}/{totalCount} available
                                    </span>
                                    <span className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all duration-300 font-medium">
                                        View Details →
                                    </span>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {filteredEquipments.length === 0 && !loading && (
                <div className="text-center mt-12">
                    <div className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl p-8 border border-white/20 inline-block shadow-xl">
                        <p className="text-white/80 text-lg">
                            {equipments.length === 0
                                ? '😔 No equipment found.'
                                : '🔍 No equipment matches the filter criteria.'}
                        </p>
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
            `}</style>
        </div>
    );
}
