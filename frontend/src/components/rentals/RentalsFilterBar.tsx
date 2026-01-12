import { Activity, History, Filter, AlertOctagon, Loader, CheckCircle, Package, RotateCcw, XCircle, Ban } from 'lucide-react';
import SearchBar from '../ui/SearchBar';

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'CHECKED_OUT' | 'OVERLAPPING';
type HistoryStatusFilter = 'ALL' | 'RETURNED' | 'REJECTED' | 'CANCELLED';
type TabType = 'active' | 'history';

interface RentalsFilterBarProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
    statusFilter: StatusFilter;
    setStatusFilter: (status: StatusFilter) => void;
    historyStatusFilter: HistoryStatusFilter;
    setHistoryStatusFilter: (status: HistoryStatusFilter) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    statusCounts: Record<StatusFilter, number>;
    historyStatusCounts: Record<HistoryStatusFilter, number>;
}

export default function RentalsFilterBar({
    activeTab, setActiveTab, statusFilter, setStatusFilter, historyStatusFilter, setHistoryStatusFilter, searchQuery, setSearchQuery, statusCounts, historyStatusCounts
}: RentalsFilterBarProps) {
    const filterButtons: { key: StatusFilter; label: string; color: string; icon?: React.ReactNode }[] = [
        { key: 'ALL', label: 'All', color: 'bg-slate-600' },
        { key: 'OVERLAPPING', label: 'Conflicts', color: 'bg-orange-600', icon: <AlertOctagon className="w-4 h-4" /> },
        { key: 'PENDING', label: 'Pending', color: 'bg-yellow-600', icon: <Loader className="w-4 h-4" /> },
        { key: 'APPROVED', label: 'Approved', color: 'bg-green-600', icon: <CheckCircle className="w-4 h-4" /> },
        { key: 'CHECKED_OUT', label: 'Checked Out', color: 'bg-blue-600', icon: <Package className="w-4 h-4" /> }
    ];
    const historyFilterButtons: { key: HistoryStatusFilter; label: string; color: string; icon?: React.ReactNode }[] = [
        { key: 'ALL', label: 'All', color: 'bg-slate-600' },
        { key: 'RETURNED', label: 'Returned', color: 'bg-slate-500', icon: <RotateCcw className="w-4 h-4" /> },
        { key: 'REJECTED', label: 'Rejected', color: 'bg-rose-600', icon: <XCircle className="w-4 h-4" /> },
        { key: 'CANCELLED', label: 'Cancelled', color: 'bg-orange-600', icon: <Ban className="w-4 h-4" /> }
    ];

    return (
        <>
            <div className="flex gap-2 mb-6">
                <button onClick={() => { setActiveTab('active'); setStatusFilter('ALL'); }} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${activeTab === 'active' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800/50 text-white/70 hover:bg-slate-700/50'}`}>
                    <Activity className="w-5 h-5" /> กำลังดำเนินการ <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'active' ? 'bg-white/20' : 'bg-white/10'}`}>{statusCounts.ALL}</span>
                </button>
                <button onClick={() => { setActiveTab('history'); setHistoryStatusFilter('ALL'); }} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${activeTab === 'history' ? 'bg-slate-600 text-white shadow-lg' : 'bg-slate-800/50 text-white/70 hover:bg-slate-700/50'}`}>
                    <History className="w-5 h-5" /> ประวัติ <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'history' ? 'bg-white/20' : 'bg-white/10'}`}>{historyStatusCounts.ALL}</span>
                </button>
            </div>

            <div className="mb-6"><SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="ค้นหาชื่อผู้ใช้, รหัสนักศึกษา, หรืออุปกรณ์..." /></div>

            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3"><Filter className="w-5 h-5 text-white/70" /><span className="text-white/70 font-medium">กรองตามสถานะ</span></div>
                <div className="flex flex-wrap gap-2">
                    {(activeTab === 'active' ? filterButtons : historyFilterButtons).map(({ key, label, color, icon }) => (
                        <button key={key} onClick={() => activeTab === 'active' ? setStatusFilter(key as StatusFilter) : setHistoryStatusFilter(key as HistoryStatusFilter)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${(activeTab === 'active' ? statusFilter : historyStatusFilter) === key ? `${color} text-white border-white/30 shadow-lg scale-105` : 'bg-slate-800/50 text-white/70 border-white/10 hover:bg-slate-700/50'}`}>
                            {icon} {label} <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${(activeTab === 'active' ? statusFilter : historyStatusFilter) === key ? 'bg-white/20' : 'bg-white/10'}`}>{activeTab === 'active' ? statusCounts[key as StatusFilter] : historyStatusCounts[key as HistoryStatusFilter]}</span>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}
