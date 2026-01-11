import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import type { Rental } from '../types';
import { ClipboardList, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import RentalCard from '../components/rentals/RentalCard';
import RentalsFilterBar from '../components/rentals/RentalsFilterBar';
import BatchActionBar from '../components/rentals/BatchActionBar';
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
    const [batchAction, setBatchAction] = useState<'APPROVED' | 'CHECKED_OUT' | 'RETURNED' | 'REJECTED' | null>(null);
    const [batchProcessing, setBatchProcessing] = useState(false);
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, errors: [] as string[] });
    const [batchRejectNote, setBatchRejectNote] = useState('');

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

    const openBatchModal = (action: 'APPROVED' | 'CHECKED_OUT' | 'RETURNED' | 'REJECTED') => { setBatchAction(action); setBatchProgress({ current: 0, total: selectedIds.size, errors: [] }); setBatchRejectNote(''); setShowBatchModal(true); };

    const handleBatchAction = async () => {
        if (!batchAction || selectedIds.size === 0) return;
        setBatchProcessing(true);
        const ids = Array.from(selectedIds), errors: string[] = [];
        for (let i = 0; i < ids.length; i++) {
            try {
                const body: { status: string; rejectReason?: string } = { status: batchAction };
                if (batchAction === 'REJECTED' && batchRejectNote.trim()) {
                    body.rejectReason = batchRejectNote.trim();
                }
                await apiClient.patch(`/rentals/${ids[i]}/status`, body);
                setBatchProgress(prev => ({ ...prev, current: i + 1 }));
            } catch (err: any) {
                errors.push(`${rentals.find(r => r.id === ids[i])?.user?.name || 'Unknown'}: ${err.response?.data?.message || 'Failed'}`);
            }
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

    // Overlapping pending for confirmation modal
    const currentRental = confirmAction ? rentals.find(r => r.id === confirmAction.id) : null;
    const overlappingPending = confirmAction?.status === 'APPROVED' && currentRental ? rentals.filter(r => r.id !== confirmAction.id && r.status === 'PENDING' && r.equipmentItemId === currentRental.equipmentItemId && isOverlapping(new Date(r.startDate), new Date(r.endDate), new Date(currentRental.startDate), new Date(currentRental.endDate))) : [];

    if (loading) return <LoadingSpinner message="Loading rentals..." />;

    const { PENDING, APPROVED, CHECKED_OUT } = getSelectedByStatus();

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {successMessage && (<div className="mb-6 flex gap-3 backdrop-blur-2xl bg-green-900/50 border border-green-500/30 rounded-xl p-4 shadow-lg animate-fade-in"><CheckCircle className="h-5 w-5 text-green-300 flex-shrink-0 mt-0.5" /><p className="text-green-200 font-semibold">{successMessage}</p></div>)}

            <div className="flex items-center gap-3 mb-6"><ClipboardList className="w-8 h-8 text-white" /><h1 className="text-3xl md:text-4xl font-bold text-white" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>Manage Rentals</h1></div>

            <RentalsFilterBar
                activeTab={activeTab} setActiveTab={setActiveTab}
                statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                historyStatusFilter={historyStatusFilter} setHistoryStatusFilter={setHistoryStatusFilter}
                searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                statusCounts={statusCounts} historyStatusCounts={historyStatusCounts}
            />

            <BatchActionBar
                selectedCount={selectedIds.size}
                pendingCount={PENDING}
                approvedCount={APPROVED}
                checkedOutCount={CHECKED_OUT}
                onBatchAction={openBatchModal}
                onClearSelection={clearSelection}
            />

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
            <BatchActionModal isOpen={showBatchModal} action={batchAction} selectedIds={selectedIds} rentals={rentals} processing={batchProcessing} progress={batchProgress} rejectNote={batchRejectNote} onRejectNoteChange={setBatchRejectNote} onConfirm={handleBatchAction} onClose={() => { setShowBatchModal(false); setBatchProgress({ current: 0, total: 0, errors: [] }); }} />
        </div>
    );
}
