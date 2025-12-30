import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import type { Equipment } from '../types';
import { UserRole, EquipmentItemStatus } from '../types';

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
            // If user is not admin, filter to show only AVAILABLE equipment
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
        // Status filter only applies to admins (regular users already only see AVAILABLE)
        if (filterStatus && isAdmin) {
            filtered = filtered.filter(item => item.status === filterStatus);
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

    if (loading) return <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center"><div className="text-gray-700">Loading...</div></div>;
    if (error) return <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center"><div className="text-red-600">{error}</div></div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <div className="p-8 max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">Available Equipment</h1>

                {/* Filters */}
                {!loading && equipments.length > 0 && (
                    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-gray-300/40 shadow-lg p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Search Name</label>
                                <input
                                    type="text"
                                    value={searchName}
                                    onChange={(e) => setSearchName(e.target.value)}
                                    placeholder="Search by name..."
                                    className="w-full bg-white/70 border border-gray-300 rounded-lg text-gray-900 p-2 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Filter by Category</label>
                                <input
                                    type="text"
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    placeholder="Filter by category..."
                                    className="w-full bg-white/70 border border-gray-300 rounded-lg text-gray-900 p-2 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Filter by Status</label>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="w-full bg-white/70 border border-gray-300 rounded-lg text-gray-900 p-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                    disabled={!isAdmin}
                                >
                                    <option value="">All Status</option>
                                    {isAdmin && (
                                        <>
                                            <option value="AVAILABLE">AVAILABLE</option>
                                            <option value="MAINTENANCE">MAINTENANCE</option>
                                            <option value="UNAVAILABLE">UNAVAILABLE</option>
                                        </>
                                    )}
                                    {!isAdmin && <option value="AVAILABLE">AVAILABLE</option>}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEquipments.map((item, index) => (
                        <Link
                            key={item.id}
                            to={`/equipments/${item.id}`}
                            className="bg-white/60 backdrop-blur-md rounded-2xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300 border border-gray-300/40 hover:border-gray-400/60 shadow-md hover:shadow-xl animate-fade-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="h-48 bg-white flex items-center justify-center border-b border-gray-100">
                                {item.imageUrl ? (
                                    <img
                                        src={item.imageUrl}
                                        alt={item.name}
                                        className="w-full h-full object-contain p-4"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=No+Image';
                                        }}
                                    />
                                ) : (
                                    <span className="text-gray-500">No Image</span>
                                )}
                            </div>

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <h2 className="text-xl font-semibold text-gray-900">{item.name}</h2>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'AVAILABLE'
                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                        : 'bg-red-100 text-red-700 border border-red-200'
                                        }`}>
                                        {item.status}
                                    </span>
                                </div>

                                <p className="text-gray-600 text-sm mb-4">{item.category}</p>

                                <div className="flex justify-between items-center text-sm text-gray-600">
                                    <span className={`font-medium ${getAvailableCount(item) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {getAvailableCount(item)}/{item.items?.length || item.stockQty} available
                                    </span>
                                    <span className="text-gray-700 font-semibold group-hover:underline">View Details →</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {filteredEquipments.length === 0 && !loading && (
                    <div className="text-center text-gray-500 mt-12 text-lg">
                        {equipments.length === 0
                            ? 'No equipment found. By default, there might be none.'
                            : 'No equipment matches the filter criteria.'}
                    </div>
                )}
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
            `}</style>
        </div>
    );
}
