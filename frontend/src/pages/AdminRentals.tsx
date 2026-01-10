import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import type { Rental } from '../types';
import { ClipboardList, CheckCircle, Package, Filter, AlertOctagon, CheckSquare, Loader, History, Activity, RotateCcw, XCircle, Ban } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import SearchBar from '../components/ui/SearchBar';
import EmptyState from '../components/ui/EmptyState';
import RentalCard from '../components/rentals/RentalCard';
import { RentalDetailModal, ActionConfirmModal, RejectModal, BatchActionModal } from '../components/rentals/RentalModals';

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'CHECKED_OUT' | 'OVERLAPPING';
type HistoryStatusFilter = 'ALL' | 'RETURNED' | 'REJECTED' | 'CANCELLED';
type TabType = 'active' | 'history';

export default function AdminRentals() {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
    const [historyStatusFilter, setHistoryStatusFilter] = useState<HistoryStatusFilter>('ALL');
    const [activeTab, setActiveTab] = useState<TabType>('active');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ id: string; status: string; userName: string } | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectingRental, setRejectingRental] = useState<{ id: string; userName: string; equipmentName: string } | null>(null);
    const [rejectNote, setRejectNote] = useState('');
    const [rejectLoading, setRejectLoading] = useState(false);

    // Batch action states
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [batchAction, setBatchAction] = useState<'APPROVED' | 'CHECKED_OUT' | 'RETURNED' | null>(null);
    const [batchProcessing, setBatchProcessing] = useState(false);
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, errors: [] as string[] });

    useEffect(() => { fetchRentals(); }, []);

    const fetchRentals = async () => {
        try {
            const response = await apiClient.get<Rental[]>('/rentals');
            setRentals(response.data.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
        } catch { console.error('Failed to load rentals'); }
        finally { setLoading(false); }
    };

    // Overlap detection
    const isOverlapping = (s1: Date, e1: Date, s2: Date, e2: Date) => s1 < e2 && e1 > s2;

    const getOverlappingRentalIds = (): Set<string> => {
        const overlappingIds = new Set<string>();
        const active = rentals.filter(r => ['PENDING', 'APPROVED', 'CHECKED_OUT'].includes(r.status));
        for (let i = 0; i < active.length; i++) {
            for (let j = i + 1; j < active.length; j++) {
                const r1 = active[i], r2 = active[j];
                const sameItem = r1.equipmentItemId && r2.equipmentItemId && r1.equipmentItemId === r2.equipmentItemId;
                if (sameItem && isOverlapping(new Date(r1.startDate), new Date(r1.endDate), new Date(r2.startDate), new Date(r2.endDate))) {
                    overlappingIds.add(r1.id); overlappingIds.add(r2.id);
                }
            }
        }
        return overlappingIds;
    };

    const overlappingRentalIds = getOverlappingRentalIds();
    const activeStatuses = ['PENDING', 'APPROVED', 'CHECKED_OUT'];
    const historyStatuses = ['RETURNED', 'REJECTED', 'CANCELLED'];

    // Filter logic
    const filteredRentals = rentals.filter(rental => {
        const tabStatuses = activeTab === 'active' ? activeStatuses : historyStatuses;
        if (!tabStatuses.includes(rental.status)) return false;
        if (activeTab === 'active') {
            if (statusFilter === 'OVERLAPPING') return overlappingRentalIds.has(rental.id);
            if (statusFilter !== 'ALL' && rental.status !== statusFilter) return false;
        } else {
            if (historyStatusFilter !== 'ALL' && rental.status !== historyStatusFilter) return false;
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const match = rental.user?.name?.toLowerCase().includes(q) || rental.user?.studentId?.toLowerCase().includes(q) || rental.equipment?.name?.toLowerCase().includes(q);
            if (!match) return false;
        }
        return true;
    });

    // Action handlers
    const showConfirmation = (id: string, status: string, userName: string) => { setConfirmAction({ id, status, userName }); setShowConfirmModal(true); };

    const handleConfirmedAction = async () => {
        if (!confirmAction) return;
        try {
            const response = await apiClient.patch<{ autoRejectedRentals?: string[] }>(`/rentals/${confirmAction.id}/status`, { status: confirmAction.status });
            let msg = `Status updated to ${confirmAction.status} successfully`;
            if (response.data.autoRejectedRentals?.length) msg += `. Auto-rejected ${response.data.autoRejectedRentals.length} overlapping request(s)`;
            setSuccessMessage(msg); fetchRentals(); setTimeout(() => setSuccessMessage(''), 5000);
        } catch { alert('Failed to update status'); }
        setShowConfirmModal(false); setConfirmAction(null);
    };

    const handleRejectClick = (rental: Rental) => { setRejectingRental({ id: rental.id, userName: rental.user?.name || 'User', equipmentName: rental.equipment?.name || 'Equipment' }); setRejectNote(''); setShowRejectModal(true); };

    const handleConfirmReject = async () => {
        if (!rejectingRental) return;
        setRejectLoading(true);
        try {
            const body: { status: string; rejectReason?: string } = { status: 'REJECTED' };
            if (rejectNote.trim()) body.rejectReason = rejectNote.trim();
            await apiClient.patch(`/rentals/${rejectingRental.id}/status`, body);
            setSuccessMessage(`Rejected request from ${rejectingRental.userName}`);
            fetchRentals(); setShowRejectModal(false); setRejectingRental(null); setRejectNote('');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch { setSuccessMessage('Failed to reject rental.'); setTimeout(() => setSuccessMessage(''), 3000); }
        finally { setRejectLoading(false); }
    };

    // Multi-select handlers
    const toggleSelect = (id: string) => setSelectedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
    const clearSelection = () => setSelectedIds(new Set());

    const openBatchModal = (action: 'APPROVED' | 'CHECKED_OUT' | 'RETURNED') => { setBatchAction(action); setBatchProgress({ current: 0, total: selectedIds.size, errors: [] }); setShowBatchModal(true); };

    const handleBatchAction = async () => {
        if (!batchAction || selectedIds.size === 0) return;
        setBatchProcessing(true);
        const ids = Array.from(selectedIds), errors: string[] = [];
        for (let i = 0; i < ids.length; i++) {
            try { await apiClient.patch(`/rentals/${ids[i]}/status`, { status: batchAction }); setBatchProgress(prev => ({ ...prev, current: i + 1 })); }
            catch (err: any) { errors.push(`${rentals.find(r => r.id === ids[i])?.user?.name || 'Unknown'}: ${err.response?.data?.message || 'Failed'}`); }
        }
        setBatchProgress(prev => ({ ...prev, errors })); fetchRentals(); clearSelection(); setBatchProcessing(false);
        if (errors.length === 0) { setShowBatchModal(false); setSuccessMessage(`Successfully processed ${ids.length} rentals`); setTimeout(() => setSuccessMessage(''), 3000); }
    };

    const getSelectedByStatus = () => {
        const selected = rentals.filter(r => selectedIds.has(r.id));
        return { PENDING: selected.filter(r => r.status === 'PENDING').length, APPROVED: selected.filter(r => r.status === 'APPROVED').length, CHECKED_OUT: selected.filter(r => r.status === 'CHECKED_OUT').length };
    };

    // Status counts
    const statusCounts: Record<StatusFilter, number> = { ALL: rentals.filter(r => activeStatuses.includes(r.status)).length, PENDING: rentals.filter(r => r.status === 'PENDING').length, APPROVED: rentals.filter(r => r.status === 'APPROVED').length, CHECKED_OUT: rentals.filter(r => r.status === 'CHECKED_OUT').length, OVERLAPPING: overlappingRentalIds.size };
    const historyStatusCounts: Record<HistoryStatusFilter, number> = { ALL: rentals.filter(r => historyStatuses.includes(r.status)).length, RETURNED: rentals.filter(r => r.status === 'RETURNED').length, REJECTED: rentals.filter(r => r.status === 'REJECTED').length, CANCELLED: rentals.filter(r => r.status === 'CANCELLED').length };

    const filterButtons: { key: StatusFilter; label: string; color: string; icon?: React.ReactNode }[] = [
        { key: 'ALL', label: 'All', color: 'bg-slate-600' }, { key: 'OVERLAPPING', label: 'Conflicts', color: 'bg-orange-600', icon: <AlertOctagon className="w-4 h-4" /> },
        { key: 'PENDING', label: 'Pending', color: 'bg-yellow-600', icon: <Loader className="w-4 h-4" /> }, { key: 'APPROVED', label: 'Approved', color: 'bg-green-600', icon: <CheckCircle className="w-4 h-4" /> },
        { key: 'CHECKED_OUT', label: 'Checked Out', color: 'bg-blue-600', icon: <Package className="w-4 h-4" /> }
    ];
    const historyFilterButtons: { key: HistoryStatusFilter; label: string; color: string; icon?: React.ReactNode }[] = [
        { key: 'ALL', label: 'All', color: 'bg-slate-600' }, { key: 'RETURNED', label: 'Returned', color: 'bg-slate-500', icon: <RotateCcw className="w-4 h-4" /> },
        { key: 'REJECTED', label: 'Rejected', color: 'bg-rose-600', icon: <XCircle className="w-4 h-4" /> }, { key: 'CANCELLED', label: 'Cancelled', color: 'bg-orange-600', icon: <Ban className="w-4 h-4" /> }
    ];

    // Overlapping pending for confirmation modal
    const currentRental = confirmAction ? rentals.find(r => r.id === confirmAction.id) : null;
    const overlappingPending = confirmAction?.status === 'APPROVED' && currentRental ? rentals.filter(r => r.id !== confirmAction.id && r.status === 'PENDING' && r.equipmentItemId === currentRental.equipmentItemId && isOverlapping(new Date(r.startDate), new Date(r.endDate), new Date(currentRental.startDate), new Date(currentRental.endDate))) : [];

    if (loading) return <LoadingSpinner message="Loading rentals..." />;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {successMessage && (<div className="mb-6 flex gap-3 backdrop-blur-2xl bg-green-900/50 border border-green-500/30 rounded-xl p-4 shadow-lg animate-fade-in"><CheckCircle className="h-5 w-5 text-green-300 flex-shrink-0 mt-0.5" /><p className="text-green-200 font-semibold">{successMessage}</p></div>)}

            <div className="flex items-center gap-3 mb-6"><ClipboardList className="w-8 h-8 text-white" /><h1 className="text-3xl md:text-4xl font-bold text-white" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>Manage Rentals</h1></div>

            <div className="flex gap-2 mb-6">
                <button onClick={() => { setActiveTab('active'); setStatusFilter('ALL'); }} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${activeTab === 'active' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800/50 text-white/70 hover:bg-slate-700/50'}`}><Activity className="w-5 h-5" /> Active <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'active' ? 'bg-white/20' : 'bg-white/10'}`}>{statusCounts.ALL}</span></button>
                <button onClick={() => { setActiveTab('history'); setHistoryStatusFilter('ALL'); }} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${activeTab === 'history' ? 'bg-slate-600 text-white shadow-lg' : 'bg-slate-800/50 text-white/70 hover:bg-slate-700/50'}`}><History className="w-5 h-5" /> History <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'history' ? 'bg-white/20' : 'bg-white/10'}`}>{historyStatusCounts.ALL}</span></button>
            </div>

            <div className="mb-6"><SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by user name, student ID, or equipment..." /></div>

            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3"><Filter className="w-5 h-5 text-white/70" /><span className="text-white/70 font-medium">Filter by Status</span></div>
                <div className="flex flex-wrap gap-2">
                    {(activeTab === 'active' ? filterButtons : historyFilterButtons).map(({ key, label, color, icon }) => (
                        <button key={key} onClick={() => activeTab === 'active' ? setStatusFilter(key as StatusFilter) : setHistoryStatusFilter(key as HistoryStatusFilter)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${(activeTab === 'active' ? statusFilter : historyStatusFilter) === key ? `${color} text-white border-white/30 shadow-lg scale-105` : 'bg-slate-800/50 text-white/70 border-white/10 hover:bg-slate-700/50'}`}>
                            {icon} {label} <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${(activeTab === 'active' ? statusFilter : historyStatusFilter) === key ? 'bg-white/20' : 'bg-white/10'}`}>{activeTab === 'active' ? statusCounts[key as StatusFilter] : historyStatusCounts[key as HistoryStatusFilter]}</span>
                        </button>
                    ))}
                </div>
            </div>

            {selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-slide-up">
                    <div className="backdrop-blur-2xl bg-slate-900/95 rounded-2xl border border-white/20 shadow-2xl p-4 flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 rounded-xl border border-blue-500/30"><CheckSquare className="w-5 h-5 text-blue-400" /><span className="text-white font-bold">{selectedIds.size}</span><span className="text-white/70">selected</span></div>
                        {(() => {
                            const c = getSelectedByStatus(); return (<>
                                {c.PENDING > 0 && <button onClick={() => openBatchModal('APPROVED')} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow-lg"><CheckCircle className="w-4 h-4" /> Approve ({c.PENDING})</button>}
                                {c.APPROVED > 0 && <button onClick={() => openBatchModal('CHECKED_OUT')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg"><Package className="w-4 h-4" /> Checkout ({c.APPROVED})</button>}
                                {c.CHECKED_OUT > 0 && <button onClick={() => openBatchModal('RETURNED')} className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold shadow-lg">Return ({c.CHECKED_OUT})</button>}
                            </>);
                        })()}
                        <button onClick={clearSelection} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl">✕</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-24">
                {filteredRentals.map(rental => (
                    <RentalCard key={rental.id} rental={rental} isSelected={selectedIds.has(rental.id)} isOverlapping={overlappingRentalIds.has(rental.id)}
                        onToggleSelect={toggleSelect} onViewDetails={(r) => { setSelectedRental(r); setShowDetailModal(true); }}
                        onApprove={(id, name) => showConfirmation(id, 'APPROVED', name)} onReject={handleRejectClick}
                        onCheckout={(id, name) => showConfirmation(id, 'CHECKED_OUT', name)} onReturn={(id, name) => showConfirmation(id, 'RETURNED', name)} />
                ))}
                {filteredRentals.length === 0 && <EmptyState icon={ClipboardList} message="No rental requests found for this filter." />}
            </div>

            <RentalDetailModal rental={selectedRental} isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} onApprove={(id, name) => showConfirmation(id, 'APPROVED', name)} onReject={(id, name) => showConfirmation(id, 'REJECTED', name)} />
            <ActionConfirmModal isOpen={showConfirmModal} action={confirmAction} overlappingPending={overlappingPending} onConfirm={handleConfirmedAction} onCancel={() => setShowConfirmModal(false)} />
            <RejectModal isOpen={showRejectModal} rental={rejectingRental} note={rejectNote} onNoteChange={setRejectNote} onConfirm={handleConfirmReject} onCancel={() => { setShowRejectModal(false); setRejectingRental(null); setRejectNote(''); }} loading={rejectLoading} />
            <BatchActionModal isOpen={showBatchModal} action={batchAction} selectedIds={selectedIds} rentals={rentals} processing={batchProcessing} progress={batchProgress} onConfirm={handleBatchAction} onClose={() => { setShowBatchModal(false); setBatchProgress({ current: 0, total: 0, errors: [] }); }} />
        </div>
    );
}
