import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import type { Rental } from '../types';
import { History, Loader, CheckCircle, ArrowUpRight, RotateCcw, XCircle, Ban, AlertTriangle, X, Activity, Archive, Filter } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import RentalItemCard from '../components/rentals/RentalItemCard';
import ConfirmModal from '../components/ui/ConfirmModal';
import UploadEvidenceModal from '../components/rentals/UploadEvidenceModal';

type TabType = 'active' | 'history';
type ActiveStatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'CHECKED_OUT';
type HistoryStatusFilter = 'ALL' | 'RETURNED' | 'REJECTED' | 'CANCELLED';

export default function MyRentals() {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('active');
    const [activeStatusFilter, setActiveStatusFilter] = useState<ActiveStatusFilter>('ALL');
    const [historyStatusFilter, setHistoryStatusFilter] = useState<HistoryStatusFilter>('ALL');

    // Modal states
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancellingRental, setCancellingRental] = useState<{ id: string; name: string } | null>(null);
    const [cancelLoading, setCancelLoading] = useState(false);

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadRental, setUploadRental] = useState<{ id: string; type: 'checkout' | 'return' } | null>(null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => { fetchMyRentals(); }, []);

    const fetchMyRentals = async () => {
        try {
            const response = await apiClient.get<Rental[]>('/rentals/me');
            setRentals(response.data.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
        } catch (err: any) { setError(err.response?.data?.message || 'โหลดข้อมูลไม่สำเร็จ'); }
        finally { setLoading(false); }
    };

    const handleCancelClick = (id: string, name: string) => { setCancellingRental({ id, name }); setShowCancelModal(true); };

    const handleConfirmCancel = async () => {
        if (!cancellingRental) return;
        setCancelLoading(true);
        try {
            await apiClient.patch(`/rentals/${cancellingRental.id}/status`, { status: 'CANCELLED' });
            await fetchMyRentals();
            setShowCancelModal(false); setCancellingRental(null); setSuccessMessage('ยกเลิกรายการยืมสำเร็จ');
        } catch (err: any) {
            const msg = err.response?.data?.message || 'ยกเลิกไม่สำเร็จ';
            setError(msg.includes('CHECKED_OUT') ? 'คุณรับอุปกรณ์ไปแล้ว ไม่สามารถยกเลิกได้' : msg);
        } finally { setCancelLoading(false); }
    };

    const handleUploadClick = (rental: Rental) => {
        const type = rental.status === 'APPROVED' ? 'checkout' : 'return';
        setUploadRental({ id: rental.id, type });
        setShowUploadModal(true);
    };

    const handleUploadSuccess = () => {
        fetchMyRentals();
        setSuccessMessage('อัปโหลดหลักฐานสำเร็จ');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const activeStatuses = ['PENDING', 'APPROVED', 'CHECKED_OUT'];
    const historyStatuses = ['RETURNED', 'REJECTED', 'CANCELLED'];
    const activeRentals = rentals.filter(r => activeStatuses.includes(r.status));
    const historyRentals = rentals.filter(r => historyStatuses.includes(r.status));
    const filteredActive = activeStatusFilter === 'ALL' ? activeRentals : activeRentals.filter(r => r.status === activeStatusFilter);
    const filteredHistory = historyStatusFilter === 'ALL' ? historyRentals : historyRentals.filter(r => r.status === historyStatusFilter);
    const displayedRentals = activeTab === 'active' ? filteredActive : filteredHistory;

    const activeStatusCounts = { ALL: activeRentals.length, PENDING: activeRentals.filter(r => r.status === 'PENDING').length, APPROVED: activeRentals.filter(r => r.status === 'APPROVED').length, CHECKED_OUT: activeRentals.filter(r => r.status === 'CHECKED_OUT').length };
    const historyStatusCounts = { ALL: historyRentals.length, RETURNED: historyRentals.filter(r => r.status === 'RETURNED').length, REJECTED: historyRentals.filter(r => r.status === 'REJECTED').length, CANCELLED: historyRentals.filter(r => r.status === 'CANCELLED').length };

    const activeFilterButtons: { key: ActiveStatusFilter; label: string; color: string; icon?: React.ReactNode }[] = [
        { key: 'ALL', label: 'All', color: 'bg-slate-600' },
        { key: 'PENDING', label: 'Pending', color: 'bg-amber-600', icon: <Loader className="w-4 h-4" /> },
        { key: 'APPROVED', label: 'Approved', color: 'bg-emerald-600', icon: <CheckCircle className="w-4 h-4" /> },
        { key: 'CHECKED_OUT', label: 'Checked Out', color: 'bg-sky-600', icon: <ArrowUpRight className="w-4 h-4" /> },
    ];
    const historyFilterButtons: { key: HistoryStatusFilter; label: string; color: string; icon?: React.ReactNode }[] = [
        { key: 'ALL', label: 'All', color: 'bg-slate-600' },
        { key: 'RETURNED', label: 'Returned', color: 'bg-slate-500', icon: <RotateCcw className="w-4 h-4" /> },
        { key: 'REJECTED', label: 'Rejected', color: 'bg-rose-600', icon: <XCircle className="w-4 h-4" /> },
        { key: 'CANCELLED', label: 'Cancelled', color: 'bg-orange-600', icon: <Ban className="w-4 h-4" /> },
    ];

    if (loading) return <LoadingSpinner message="กำลังโหลดรายการยืม..." />;

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6"><History className="w-8 h-8 text-white" /><h1 className="text-3xl md:text-4xl font-bold text-white" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>รายการยืมของฉัน</h1></div>

            {successMessage && (
                <div className="mb-6 flex gap-3 backdrop-blur-2xl bg-green-900/50 border border-green-500/30 rounded-xl p-4 shadow-lg animate-fade-in">
                    <CheckCircle className="h-5 w-5 text-green-300 flex-shrink-0 mt-0.5" />
                    <p className="text-green-200 font-semibold">{successMessage}</p>
                </div>
            )}

            {error && (
                <div className="backdrop-blur-2xl bg-red-900/50 rounded-xl p-4 border border-red-500/30 mb-6 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" /><p className="text-red-200 text-sm">{error}</p>
                    <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
                </div>
            )}

            <div className="flex gap-2 mb-6">
                <button onClick={() => { setActiveTab('active'); setActiveStatusFilter('ALL'); }} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${activeTab === 'active' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' : 'bg-slate-800/50 text-white/70 hover:bg-slate-700/50 border border-white/10'}`}>
                    <Activity className="w-4 h-4" /> กำลังดำเนินการ {activeRentals.length > 0 && <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'active' ? 'bg-white/20' : 'bg-blue-500/30'}`}>{activeRentals.length}</span>}
                </button>
                <button onClick={() => { setActiveTab('history'); setHistoryStatusFilter('ALL'); }} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${activeTab === 'history' ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg' : 'bg-slate-800/50 text-white/70 hover:bg-slate-700/50 border border-white/10'}`}>
                    <Archive className="w-4 h-4" /> ประวัติ {historyRentals.length > 0 && <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'history' ? 'bg-white/20' : 'bg-slate-500/30'}`}>{historyRentals.length}</span>}
                </button>
            </div>

            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3"><Filter className="w-5 h-5 text-white/70" /><span className="text-white/70 font-medium">กรองตามสถานะ</span></div>
                <div className="flex flex-wrap gap-2">
                    {(activeTab === 'active' ? activeFilterButtons : historyFilterButtons).map(({ key, label, color, icon }) => (
                        <button key={key} onClick={() => activeTab === 'active' ? setActiveStatusFilter(key as ActiveStatusFilter) : setHistoryStatusFilter(key as HistoryStatusFilter)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${(activeTab === 'active' ? activeStatusFilter : historyStatusFilter) === key ? `${color} text-white border-white/30 shadow-lg scale-105` : 'bg-slate-800/50 text-white/70 border-white/10 hover:bg-slate-700/50'}`}>
                            {icon} {label} <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${(activeTab === 'active' ? activeStatusFilter : historyStatusFilter) === key ? 'bg-white/20' : 'bg-white/10'}`}>{activeTab === 'active' ? activeStatusCounts[key as ActiveStatusFilter] : historyStatusCounts[key as HistoryStatusFilter]}</span>
                        </button>
                    ))}
                </div>
            </div>

            {displayedRentals.length === 0 ? (
                <EmptyState icon={activeTab === 'active' ? Activity : Archive} message={activeTab === 'active' ? "ไม่มีรายการที่กำลังดำเนินการ" : "ไม่มีประวัติการยืม"} />
            ) : (
                <div className="space-y-4">
                    {displayedRentals.map(rental => (
                        <RentalItemCard
                            key={rental.id}
                            rental={rental}
                            onCancel={handleCancelClick}
                            onUpload={handleUploadClick}
                        />
                    ))}
                </div>
            )}

            <ConfirmModal isOpen={showCancelModal} title="ยกเลิกรายการยืม" message={`ต้องการยกเลิกคำขอยืม ${cancellingRental?.name} หรือไม่?`} variant="danger" confirmLabel="ยกเลิก" cancelLabel="ไม่ยกเลิก" onConfirm={handleConfirmCancel} onCancel={() => { setShowCancelModal(false); setCancellingRental(null); }} loading={cancelLoading}>
                <p className="text-amber-400/80 text-sm mt-2">การกระทำนี้ไม่สามารถย้อนกลับได้</p>
            </ConfirmModal>

            {uploadRental && (
                <UploadEvidenceModal
                    isOpen={showUploadModal}
                    rentalId={uploadRental.id}
                    imageType={uploadRental.type}
                    onClose={() => setShowUploadModal(false)}
                    onSuccess={handleUploadSuccess}
                />
            )}
        </div>
    );
}
