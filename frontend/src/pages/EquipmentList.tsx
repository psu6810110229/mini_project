import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import type { Equipment } from '../types';
import { UserRole } from '../types';
import { Package } from 'lucide-react';
import { mergeWithEquipmentCategories } from '../components/CategoryManager';
import { LoadingSpinner, EmptyState } from '../components/ui';
import EquipmentFilter from '../components/equipment/EquipmentFilter';
import EquipmentGrid from '../components/equipment/EquipmentGrid';

export default function EquipmentList() {
    // ===== STATE MANAGEMENT =====
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter states
    const [searchName, setSearchName] = useState('');
    const [filterCategories, setFilterCategories] = useState<string[]>([]);
    const [categories, setCategories] = useState<string[]>([]);

    // Check if user is admin
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isAdmin = user?.role === UserRole.ADMIN;

    // ===== FETCH DATA ON MOUNT =====
    useEffect(() => { fetchEquipments(); }, []);

    const fetchEquipments = async () => {
        try {
            const response = await apiClient.get<Equipment[]>('/equipments');
            const allEquipments = response.data;
            const equipmentsToShow = isAdmin ? allEquipments : allEquipments.filter(item => item.status === 'AVAILABLE');
            setEquipments(equipmentsToShow);
            setFilteredEquipments(equipmentsToShow);

            const equipmentCategories = [...new Set(response.data.map(e => e.category).filter(Boolean))];
            setCategories(mergeWithEquipmentCategories(equipmentCategories));
        } catch (err) {
            setError('Failed to load equipments');
        } finally {
            setLoading(false);
        }
    };

    // ===== APPLY FILTERS =====
    useEffect(() => {
        let filtered = [...equipments];
        if (filterCategories.length > 0) {
            filtered = filtered.filter(item => filterCategories.includes(item.category));
        }
        if (searchName) {
            filtered = filtered.filter(item => item.name.toLowerCase().includes(searchName.toLowerCase()));
        }
        setFilteredEquipments(filtered);
    }, [equipments, filterCategories, searchName]);

    // ===== CONDITIONAL RENDERING =====
    if (loading) return <LoadingSpinner message="Loading equipment..." />;
    if (error) return <div className="min-h-[80vh] flex items-center justify-center"><div className="backdrop-blur-2xl bg-red-900/50 rounded-2xl p-8 border border-red-500/30"><p className="text-red-200">{error}</p></div></div>;

    // ===== MAIN RENDER =====
    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-8" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>Available Equipment</h1>

            {/* Filters Section */}
            {equipments.length > 0 && (
                <EquipmentFilter
                    searchName={searchName}
                    setSearchName={setSearchName}
                    filterCategories={filterCategories}
                    setFilterCategories={setFilterCategories}
                    categories={categories}
                />
            )}

            {/* Equipment Grid */}
            <EquipmentGrid equipments={filteredEquipments} />

            {/* Empty State */}
            {filteredEquipments.length === 0 && <EmptyState icon={Package} message={equipments.length === 0 ? 'No equipment found.' : 'No equipment matches the filter.'} />}
        </div>
    );
}

