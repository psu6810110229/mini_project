/**
 * Admin Dashboard Page
 * 
 * Shows comprehensive rental system statistics:
 * 1. Today's rentals count (unique users)
 * 2. Equipment filtered by status
 * 3. Top renters (who rents most)
 * 4. Most rented equipment
 * 5. Activity logs with expandable details
 */
import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import type { Rental, Equipment, AuditLog } from '../types';
import { LayoutDashboard, Package, Trash2, Crown, Award } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import DashboardStatCards from '../components/dashboard/DashboardStatCards';
import RecentActivityLogs from '../components/dashboard/RecentActivityLogs';
import DeleteLogsModal from '../components/dashboard/DeleteLogsModal';

export default function AdminDashboard() {
    // Data states
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [equipmentStatusFilter, setEquipmentStatusFilter] = useState<string>('ALL');
    const [searchUser, setSearchUser] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [filterCategory, setFilterCategory] = useState<string>('ALL');

    // Delete logs modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteDays, setDeleteDays] = useState<number | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const [deleteSuccess, setDeleteSuccess] = useState('');

    // Fetch data
    useEffect(() => {
        Promise.all([
            apiClient.get<Rental[]>('/rentals'),
            apiClient.get<Equipment[]>('/equipments'),
            apiClient.get<AuditLog[]>('/audit-logs')
        ]).then(([rentalsRes, equipmentsRes, logsRes]) => {
            setRentals(rentalsRes.data);
            setEquipments(equipmentsRes.data);
            setLogs(logsRes.data);
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    // Refresh data after delete
    const refreshData = async () => {
        try {
            const logsRes = await apiClient.get<AuditLog[]>('/audit-logs');
            setLogs(logsRes.data);
        } catch (err) { console.error(err); }
    };

    // Handle delete logs
    const handleDeleteLogs = async () => {
        if (!deletePassword) { setDeleteError('Please enter admin password'); return; }
        setDeleteLoading(true); setDeleteError('');
        try {
            const response = await apiClient.delete('/audit-logs/clear', {
                data: { adminPassword: deletePassword, days: deleteDays }
            });
            setDeleteSuccess(response.data.message); setDeletePassword('');
            await refreshData();
            setTimeout(() => { setShowDeleteModal(false); setDeleteSuccess(''); }, 2000);
        } catch (err: any) {
            setDeleteError(err.response?.data?.message || 'Failed to delete logs');
        } finally { setDeleteLoading(false); }
    };

    // Derived data for equipment lists
    const filteredEquipments = equipmentStatusFilter === 'ALL'
        ? equipments
        : equipments.filter(e => e.status === equipmentStatusFilter);

    // Calc most rented stats
    const rentalCounts: Record<string, number> = {};
    const equipmentUsers: Record<string, Set<string>> = {};
    rentals.forEach(r => {
        if (!r.equipment) return;
        const id = r.equipment.id;
        rentalCounts[id] = (rentalCounts[id] || 0) + 1;
        if (!equipmentUsers[id]) equipmentUsers[id] = new Set();
        if (r.user) equipmentUsers[id].add(r.user.id);
    });
    const mostRentedItems = [...equipments]
        .filter(e => rentalCounts[e.id])
        .sort((a, b) => (rentalCounts[b.id] || 0) - (rentalCounts[a.id] || 0))
        .slice(0, 5);

    // Calc top renters
    const userRentalCounts: Record<string, { name: string; studentId: string; count: number; items: Set<string> }> = {};
    rentals.forEach(r => {
        if (!r.user) return;
        const uid = r.user.id;
        if (!userRentalCounts[uid]) userRentalCounts[uid] = { name: r.user.name, studentId: r.user.studentId, count: 0, items: new Set() };
        userRentalCounts[uid].count++;
        if (r.equipment) userRentalCounts[uid].items.add(r.equipment.name);
    });
    const topRenters = Object.values(userRentalCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    if (loading) return <LoadingSpinner message="Loading dashboard..." />;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <LayoutDashboard className="w-8 h-8 text-white" />
                    <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>Admin Dashboard</h1>
                </div>
                <button
                    onClick={() => { setShowDeleteModal(true); setDeleteError(''); setDeleteSuccess(''); setDeletePassword(''); setDeleteDays(null); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 transition-all"
                >
                    <Trash2 className="w-4 h-4" /> Clear Logs
                </button>
            </div>

            {/* Stat Cards */}
            <DashboardStatCards rentals={rentals} equipments={equipments} logsCount={logs.length} />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <RecentActivityLogs
                    logs={logs} searchUser={searchUser} setSearchUser={setSearchUser}
                    sortOrder={sortOrder} setSortOrder={setSortOrder}
                    filterCategory={filterCategory} setFilterCategory={setFilterCategory}
                />

                <div className="space-y-8">
                    {/* Equipment by Status */}
                    <div className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl border border-white/20 shadow-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Package className="w-5 h-5 text-white/70" />
                                <h2 className="text-xl font-bold text-white">Equipment Status</h2>
                            </div>
                            <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                                {['ALL', 'AVAILABLE', 'MAINTENANCE', 'UNAVAILABLE'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setEquipmentStatusFilter(status)}
                                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${equipmentStatusFilter === status ? 'bg-white text-slate-900 shadow-md' : 'text-white/50 hover:text-white'}`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                            {filteredEquipments.length === 0 ? <p className="text-white/40 text-center py-4">No equipment found</p> : filteredEquipments.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-800 bg-cover bg-center" style={{ backgroundImage: `url(${item.imageUrl})` }} />
                                        <div>
                                            <p className="font-medium text-white">{item.name}</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs text-white/40 max-w-[200px] overflow-hidden whitespace-nowrap text-ellipsis" title={item.items?.map(i => i.itemCode).join(', ')}>
                                                    IDS: {item.items && item.items.length > 0 ? item.items.map(i => i.itemCode).join(', ') : 'No items'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${item.status === 'AVAILABLE' ? 'bg-green-500/20 text-green-300' : item.status === 'MAINTENANCE' ? 'bg-orange-500/20 text-orange-300' : 'bg-red-500/20 text-red-300'}`}>
                                        {item.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Renters & Most Rented */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Top Renters */}
                        <div className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl border border-white/20 shadow-xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Crown className="w-5 h-5 text-yellow-400" />
                                <h3 className="font-bold text-white">Top Renters</h3>
                            </div>
                            <div className="space-y-3">
                                {topRenters.slice(0, 3).map((r, i) => (
                                    <div key={i} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-300 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                                            <span className="text-white/80">{r.name}</span>
                                        </div>
                                        <span className="text-white font-bold">{r.count} rentals</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Most Rented */}
                        <div className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl border border-white/20 shadow-xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Award className="w-5 h-5 text-blue-400" />
                                <h3 className="font-bold text-white">Popular Items</h3>
                            </div>
                            <div className="space-y-3">
                                {mostRentedItems.slice(0, 3).map((item, i) => (
                                    <div key={i} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-300 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                                            <span className="text-white/80 truncate max-w-[100px]">{item.name}</span>
                                        </div>
                                        <span className="text-white font-bold">{rentalCounts[item.id]} times</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <DeleteLogsModal
                show={showDeleteModal} onClose={() => setShowDeleteModal(false)}
                deletePassword={deletePassword} setDeletePassword={setDeletePassword}
                deleteDays={deleteDays} setDeleteDays={setDeleteDays}
                deleteLoading={deleteLoading} deleteError={deleteError}
                deleteSuccess={deleteSuccess} onDelete={handleDeleteLogs}
            />
        </div>
    );
}
