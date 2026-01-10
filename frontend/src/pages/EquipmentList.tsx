/**
 * EquipmentList Page
 * 
 * Displays all available equipment for users to browse.
 * Users can search, filter by category, and filter by availability.
 * 
 * KEY CONCEPTS:
 * 1. useState - React hook for storing data that can change
 * 2. useEffect - React hook for side effects (like fetching data)
 * 3. Filtering - Array.filter() to show only matching items
 * 
 * DATA FLOW:
 *   1. Component mounts → fetchEquipments() called
 *   2. Data stored in 'equipments' state
 *   3. User applies filters → filteredEquipments updated
 *   4. UI renders filteredEquipments
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import type { Equipment } from '../types';
import { UserRole, EquipmentItemStatus } from '../types';
import { Search, Package, Tag } from 'lucide-react';
import { mergeWithEquipmentCategories } from '../components/CategoryManager';
import { LoadingSpinner, EmptyState } from '../components/ui';

export default function EquipmentList() {
    // ===== STATE MANAGEMENT =====
    // useState returns [currentValue, setterFunction]
    const [equipments, setEquipments] = useState<Equipment[]>([]);           // All equipment from API
    const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]); // After filters applied
    const [loading, setLoading] = useState(true);                            // Show loading spinner
    const [error, setError] = useState('');                                  // Error message if any

    // Filter states - controlled by user input
    const [searchName, setSearchName] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCategories, setFilterCategories] = useState<string[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showAvailabilityDropdown, setShowAvailabilityDropdown] = useState(false);

    // Check if user is admin (admins see all equipment, users see only available)
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isAdmin = user?.role === UserRole.ADMIN;

    // ===== FETCH DATA ON MOUNT =====
    // useEffect with [] runs once when component first appears
    useEffect(() => { fetchEquipments(); }, []);

    /**
     * Fetches equipment list from backend API
     * Called once when page loads
     */
    const fetchEquipments = async () => {
        try {
            const response = await apiClient.get<Equipment[]>('/equipments');
            const allEquipments = response.data;
            // Admin sees all, users see only available equipment
            const equipmentsToShow = isAdmin ? allEquipments : allEquipments.filter(item => item.status === 'AVAILABLE');
            setEquipments(equipmentsToShow);
            setFilteredEquipments(equipmentsToShow);

            // Extract unique categories from equipment
            const equipmentCategories = [...new Set(response.data.map(e => e.category).filter(Boolean))];
            setCategories(mergeWithEquipmentCategories(equipmentCategories));
        } catch (err) {
            setError('Failed to load equipments');
        } finally {
            setLoading(false);  // Stop showing spinner
        }
    };

    // ===== APPLY FILTERS =====
    // This effect runs whenever any filter changes
    useEffect(() => {
        let filtered = [...equipments];  // Start with all equipment

        // Apply status filter
        if (filterStatus) {
            if (isAdmin) {
                filtered = filtered.filter(item => item.status === filterStatus);
            } else {
                if (filterStatus === 'HAS_AVAILABLE') filtered = filtered.filter(item => getAvailableCount(item) > 0);
                else if (filterStatus === 'NO_AVAILABLE') filtered = filtered.filter(item => getAvailableCount(item) === 0);
            }
        }
        // Apply category filter
        if (filterCategories.length > 0) {
            filtered = filtered.filter(item => filterCategories.includes(item.category));
        }
        // Apply search filter (case-insensitive)
        if (searchName) {
            filtered = filtered.filter(item => item.name.toLowerCase().includes(searchName.toLowerCase()));
        }
        setFilteredEquipments(filtered);
    }, [equipments, filterStatus, filterCategories, searchName, isAdmin]);

    /**
     * Counts available items for an equipment
     * @param equipment - Equipment object with items array
     * @returns Number of available items
     */
    const getAvailableCount = (equipment: Equipment) => equipment.items?.filter(i => i.status === EquipmentItemStatus.AVAILABLE).length || equipment.stockQty;
    const getTotalCount = (equipment: Equipment) => equipment.items?.length || equipment.stockQty;

    // ===== CONDITIONAL RENDERING =====
    if (loading) return <LoadingSpinner message="Loading equipment..." />;
    if (error) return <div className="min-h-[80vh] flex items-center justify-center"><div className="backdrop-blur-2xl bg-red-900/50 rounded-2xl p-8 border border-red-500/30"><p className="text-red-200">{error}</p></div></div>;

    // ===== MAIN RENDER =====
    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-8" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>Available Equipment</h1>

            {/* Filters Section */}
            {equipments.length > 0 && (
                <div className="relative z-20 backdrop-blur-2xl bg-slate-900/60 rounded-2xl border border-white/20 shadow-xl p-4 md:p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search Input */}
                        <div className="group">
                            <label className="block text-sm font-semibold text-white mb-2"><Search className="inline w-4 h-4 mr-1" />Search Name</label>
                            <input type="text" value={searchName} onChange={(e) => setSearchName(e.target.value)} placeholder="Search by name..." className="w-full backdrop-blur-xl bg-slate-800/60 border border-white/20 rounded-xl py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                        </div>

                        {/* Category Filter Dropdown */}
                        <div className="group">
                            <label className="block text-sm font-semibold text-white mb-2"><Tag className="inline w-4 h-4 mr-1" />Category</label>
                            <div className="relative">
                                <button type="button" onClick={() => setShowCategoryDropdown(!showCategoryDropdown)} className="w-full backdrop-blur-xl bg-slate-800/60 border border-white/20 rounded-xl py-3 px-4 text-left text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 flex items-center justify-between">
                                    <span className={filterCategories.length > 0 ? 'text-white' : 'text-white/40'}>{filterCategories.length > 0 ? `${filterCategories.length} selected` : 'All Categories'}</span>
                                    <svg className={`w-4 h-4 text-white/60 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                {showCategoryDropdown && (
                                    <div className="absolute z-[100] w-full mt-2 backdrop-blur-2xl bg-slate-800/95 border border-white/20 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                                        {filterCategories.length > 0 && <button type="button" onClick={() => setFilterCategories([])} className="w-full p-3 text-left text-sm text-blue-400 hover:bg-white/10 border-b border-white/10">Clear all</button>}
                                        {categories.map(cat => (
                                            <label key={cat} className="flex items-center gap-3 p-3 hover:bg-white/10 cursor-pointer">
                                                <input type="checkbox" checked={filterCategories.includes(cat)} onChange={(e) => e.target.checked ? setFilterCategories([...filterCategories, cat]) : setFilterCategories(filterCategories.filter(c => c !== cat))} className="w-4 h-4 rounded" />
                                                <span className="text-white text-sm">{cat}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Availability Filter */}
                        <div className="group">
                            <label className="block text-sm font-semibold text-white mb-2">Availability</label>
                            <div className="relative">
                                <button type="button" onClick={() => setShowAvailabilityDropdown(!showAvailabilityDropdown)} className="w-full backdrop-blur-xl bg-slate-800/60 border border-white/20 rounded-xl py-3 px-4 text-left text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 flex items-center justify-between">
                                    <span className={filterStatus ? 'text-white' : 'text-white/40'}>{filterStatus ? (filterStatus === 'HAS_AVAILABLE' ? '✓ Has Available' : '✗ None Available') : 'All Equipment'}</span>
                                    <svg className={`w-4 h-4 text-white/60 transition-transform ${showAvailabilityDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                {showAvailabilityDropdown && (
                                    <div className="absolute z-[100] w-full mt-2 backdrop-blur-2xl bg-slate-800/95 border border-white/20 rounded-xl shadow-2xl overflow-hidden">
                                        <button type="button" onClick={() => { setFilterStatus(''); setShowAvailabilityDropdown(false); }} className={`w-full p-3 text-left text-sm hover:bg-white/10 ${!filterStatus ? 'bg-blue-500/20 text-white' : 'text-white/70'}`}>All Equipment</button>
                                        {[{ value: 'HAS_AVAILABLE', label: '✓ Has Available' }, { value: 'NO_AVAILABLE', label: '✗ None Available' }].map(opt => (
                                            <button key={opt.value} type="button" onClick={() => { setFilterStatus(opt.value); setShowAvailabilityDropdown(false); }} className={`w-full p-3 text-left text-sm hover:bg-white/10 ${filterStatus === opt.value ? 'bg-blue-500/20 text-white' : 'text-white/70'}`}>{opt.label}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Equipment Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEquipments.map((item, index) => {
                    const availableCount = getAvailableCount(item);
                    const totalCount = getTotalCount(item);
                    return (
                        <Link key={item.id} to={`/equipments/${item.id}`} className="group backdrop-blur-2xl bg-slate-900/60 rounded-2xl overflow-hidden hover:scale-[1.02] transition-all border border-white/20 hover:border-white/40 shadow-xl animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                            <div className="h-48 bg-white flex items-center justify-center border-b border-white/10 overflow-hidden">
                                {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500" /> : <Package className="w-12 h-12 text-gray-400" />}
                            </div>
                            <div className="p-6">
                                <h2 className="text-xl font-semibold text-white mb-2">{item.name}</h2>
                                <p className="text-white/70 text-sm mb-4">{item.category}</p>
                                <div className="flex justify-between items-center text-sm">
                                    <span className={`font-bold ${availableCount > 0 ? 'text-green-400' : 'text-red-400'}`}>{availableCount}/{totalCount} available</span>
                                    <span className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all font-medium">View Details →</span>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Empty State */}
            {filteredEquipments.length === 0 && <EmptyState icon={Package} message={equipments.length === 0 ? 'No equipment found.' : 'No equipment matches the filter.'} />}
        </div>
    );
}
