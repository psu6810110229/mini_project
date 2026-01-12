import { useState } from 'react';
import { User, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import type { AuditLog } from '../../types';
import { getActionLabel, formatTime, parseDetails } from '../../utils/dashboardUtils';
import SearchBar from '../ui/SearchBar';
import EmptyState from '../ui/EmptyState';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface RecentActivityLogsProps {
    logs: AuditLog[];
    searchUser: string;
    setSearchUser: (value: string) => void;
    sortOrder: 'newest' | 'oldest';
    setSortOrder: React.Dispatch<React.SetStateAction<'newest' | 'oldest'>>;
    filterCategory: string;
    setFilterCategory: (value: string) => void;
}

export default function RecentActivityLogs({
    logs, searchUser, setSearchUser, sortOrder, setSortOrder, filterCategory, setFilterCategory
}: RecentActivityLogsProps) {
    const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

    const toggleLogExpand = (id: string) => {
        setExpandedLogs(prev => {
            const s = new Set(prev);
            s.has(id) ? s.delete(id) : s.add(id);
            return s;
        });
    };

    // Filter and sort logs
    const filteredLogs = logs
        .filter(l => {
            if (filterCategory !== 'ALL' && getActionLabel(l.actionType).category !== filterCategory) return false;
            if (searchUser && !l.username.toLowerCase().includes(searchUser.toLowerCase())) return false;
            return true;
        })
        .sort((a, b) => sortOrder === 'newest'
            ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .slice(0, 20);

    return (
        <div className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl border border-white/20 shadow-xl p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-white/70" />
                    <h2 className="text-xl font-bold text-white">ประวัติกิจกรรม</h2>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex gap-1">
                        {[
                            { key: 'ALL', label: 'ทั้งหมด', icon: '📋' },
                            { key: 'Rental', label: 'การยืม', icon: '📦' },
                            { key: 'Equipment', label: 'อุปกรณ์', icon: '🔧' },
                        ].map(cat => (
                            <button key={cat.key} onClick={() => setFilterCategory(cat.key)}
                                className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${filterCategory === cat.key ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'}`}>
                                {cat.icon} {cat.label}
                            </button>
                        ))}
                    </div>
                    <SearchBar value={searchUser} onChange={setSearchUser} placeholder="ค้นหาผู้ใช้..." />
                    <button onClick={() => setSortOrder(s => s === 'newest' ? 'oldest' : 'newest')} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/60">
                        {sortOrder === 'newest' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {filteredLogs.length === 0 ? (
                <EmptyState icon={FileText} message="ไม่พบประวัติกิจกรรม" />
            ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredLogs.map(log => {
                        const a = getActionLabel(log.actionType);
                        const details = parseDetails(log.details);
                        const isExpanded = expandedLogs.has(log.id);
                        return (
                            <div key={log.id} className="rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors overflow-hidden">
                                <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => toggleLogExpand(log.id)}>
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-white font-medium">{log.username}</span>
                                            <span className="text-white/40">•</span>
                                            <span className={`${a.color}`}>{a.icon} {a.label}</span>
                                        </div>
                                        {/* Brief preview */}
                                        {details && (
                                            <p className="text-white/40 text-xs truncate">
                                                {details.equipmentName && `📦 ${details.equipmentName}`}
                                                {details.itemCode && ` • Item: ${details.itemCode}`}
                                                {details.previousStatus && details.newStatus && ` • ${details.previousStatus} → ${details.newStatus}`}
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-white/40 text-sm flex-shrink-0">{formatTime(log.createdAt)}</span>
                                    <div className="flex-shrink-0">
                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                                    </div>
                                </div>
                                {/* Expanded details */}
                                {isExpanded && details && (
                                    <div className="px-4 pb-3 space-y-2 border-t border-white/10 bg-black/20">
                                        <div className="pt-3 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                            {details.equipmentName && <DetailItem label="อุปกรณ์" value={details.equipmentName} />}
                                            {details.equipmentId && <DetailItem label="ID อุปกรณ์" value={details.equipmentId.slice(0, 8) + '...'} />}
                                            {details.equipmentItemId && <DetailItem label="ID รายการ" value={details.equipmentItemId.slice(0, 8) + '...'} />}
                                            {details.itemCode && <DetailItem label="รหัสรายการ" value={details.itemCode} />}
                                            {details.startDate && <DetailItem label="วันเริ่ม" value={new Date(details.startDate).toLocaleDateString('th-TH-u-ca-buddhist')} />}
                                            {details.endDate && <DetailItem label="วันสิ้นสุด" value={new Date(details.endDate).toLocaleDateString('th-TH-u-ca-buddhist')} />}
                                            {details.previousStatus && <DetailItem label="สถานะเดิม" value={details.previousStatus} />}
                                            {details.newStatus && <DetailItem label="สถานะใหม่" value={details.newStatus} />}
                                            {details.reason && <DetailItem label="เหตุผล" value={details.reason} />}
                                            {details.rejectReason && <DetailItem label="เหตุผลที่ปฏิเสธ" value={details.rejectReason} />}
                                            {details.oldStatus && details.newStatus && <DetailItem label="เปลี่ยนสถานะ" value={`${details.oldStatus} → ${details.newStatus}`} />}
                                        </div>
                                        <p className="text-white/30 text-xs">เวลาเต็ม: {new Date(log.createdAt).toLocaleString('th-TH-u-ca-buddhist')}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-white/5 rounded-lg px-2 py-1.5">
            <span className="text-white/40">{label}: </span>
            <span className="text-white/80 font-medium">{value}</span>
        </div>
    );
}
