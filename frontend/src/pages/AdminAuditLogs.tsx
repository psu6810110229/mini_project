import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import type { AuditLog } from '../types';
import { FileText, Filter, User, Calendar, Activity, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import SearchBar from '../components/ui/SearchBar';
import EmptyState from '../components/ui/EmptyState';

const ACTION_MAP: Record<string, { label: string; icon: string; color: string }> = {
    'LOGIN': { label: 'User Login', icon: '🔐', color: 'text-blue-400' },
    'LOGOUT': { label: 'User Logout', icon: '🚪', color: 'text-gray-400' },
    'CREATE_EQUIPMENT': { label: 'Equipment Created', icon: '📦', color: 'text-green-400' },
    'UPDATE_EQUIPMENT': { label: 'Equipment Updated', icon: '✏️', color: 'text-yellow-400' },
    'DELETE_EQUIPMENT': { label: 'Equipment Deleted', icon: '🗑️', color: 'text-red-400' },
    'UPDATE_ITEM_STATUS': { label: 'Item Status Changed', icon: '🔄', color: 'text-purple-400' },
    'CREATE_RENTAL': { label: 'Rental Request', icon: '📋', color: 'text-blue-400' },
    'APPROVE_RENTAL': { label: 'Rental Approved', icon: '✅', color: 'text-green-400' },
    'REJECT_RENTAL': { label: 'Rental Rejected', icon: '❌', color: 'text-red-400' },
    'CHECKOUT_RENTAL': { label: 'Equipment Checked Out', icon: '📤', color: 'text-blue-400' },
    'RETURN_RENTAL': { label: 'Equipment Returned', icon: '📥', color: 'text-green-400' },
    'CANCEL_RENTAL': { label: 'Rental Cancelled', icon: '🚫', color: 'text-red-400' },
    'REGISTER': { label: 'New User Registered', icon: '👤', color: 'text-green-400' },
};

const getActionLabel = (type: string) => ACTION_MAP[type] || { label: type, icon: '📝', color: 'text-gray-400' };

const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000), hrs = Math.floor(diff / 3600000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 2) return `${hrs}h ago`;
    if (date.toDateString() === new Date().toDateString()) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const formatDetails = (details?: string) => {
    if (!details) return null;
    try {
        const p = JSON.parse(details);
        const items = [];
        if (p.equipmentName) items.push({ l: 'Equipment', v: p.equipmentName });
        if (p.itemCode) items.push({ l: 'Item', v: p.itemCode });
        if (p.oldStatus && p.newStatus) items.push({ l: 'Status', v: `${p.oldStatus} → ${p.newStatus}` });
        if (p.status && !p.oldStatus) items.push({ l: 'Status', v: p.status });
        if (p.startDate) items.push({ l: 'Start', v: new Date(p.startDate).toLocaleDateString() });
        if (p.endDate) items.push({ l: 'End', v: new Date(p.endDate).toLocaleDateString() });
        if (p.reason) items.push({ l: 'Reason', v: p.reason });
        if (items.length === 0) return <span className="text-white/50 text-sm">No details</span>;
        return <div className="flex flex-wrap gap-2">{items.map((i, idx) => <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-xs"><span className="text-white/50">{i.l}:</span><span className="text-white/80 font-medium">{i.v}</span></span>)}</div>;
    } catch { return <span className="text-white/50 text-sm">{details}</span>; }
};

export default function AdminAuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterTypes, setFilterTypes] = useState<Set<string>>(new Set());
    const [searchUser, setSearchUser] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    useEffect(() => { apiClient.get<AuditLog[]>('/audit-logs').then(r => setLogs(r.data)).catch(() => { }).finally(() => setLoading(false)); }, []);

    const toggleType = (t: string) => setFilterTypes(prev => { const s = new Set(prev); s.has(t) ? s.delete(t) : s.add(t); return s; });

    const filteredLogs = logs.filter(l => (filterTypes.size === 0 || filterTypes.has(l.actionType)) && (!searchUser || l.username.toLowerCase().includes(searchUser.toLowerCase()) || l.userId.toLowerCase().includes(searchUser.toLowerCase())))
        .sort((a, b) => sortOrder === 'newest' ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const uniqueTypes = Array.from(new Set(logs.map(l => l.actionType)));
    const todayLogs = logs.filter(l => new Date(l.createdAt) >= new Date(new Date().setHours(0, 0, 0, 0))).length;
    const rentalLogs = logs.filter(l => l.actionType.includes('RENTAL')).length;
    const equipLogs = logs.filter(l => l.actionType.includes('EQUIPMENT') || l.actionType.includes('ITEM')).length;
    const weekUsers = new Set(logs.filter(l => new Date(l.createdAt) >= new Date(Date.now() - 7 * 86400000)).map(l => l.userId)).size;

    if (loading) return <LoadingSpinner message="Loading logs..." />;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-6"><Activity className="w-8 h-8 text-white" /><h1 className="text-3xl md:text-4xl font-bold text-white" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>System Audit Logs</h1></div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[{ label: 'Today', value: todayLogs, color: 'blue', icon: Calendar, sub: 'activities' }, { label: 'Rentals', value: rentalLogs, color: 'green', icon: FileText, sub: 'total logs' }, { label: 'Equipment', value: equipLogs, color: 'purple', icon: Activity, sub: 'total logs' }, { label: 'Active Users', value: weekUsers, color: 'amber', icon: User, sub: 'this week' }].map(s => (
                    <div key={s.label} className={`bg-gradient-to-br from-${s.color}-600/90 to-${s.color}-700/80 rounded-xl p-4 border border-${s.color}-400/30 shadow-lg`}>
                        <div className={`flex items-center gap-2 text-${s.color}-100 mb-1`}><s.icon className="w-4 h-4" /><span className="text-sm font-medium">{s.label}</span></div>
                        <p className="text-2xl font-bold text-white">{s.value}</p><p className={`text-xs text-${s.color}-200`}>{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl border border-white/20 shadow-xl p-4 md:p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className="block text-sm font-semibold text-white mb-2"><User className="inline w-4 h-4 mr-1" />Search User</label><SearchBar value={searchUser} onChange={setSearchUser} placeholder="Type username or ID..." /></div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-white mb-2"><Filter className="inline w-4 h-4 mr-1" />Filter by Type</label>
                        <div className="flex flex-wrap gap-2">
                            {uniqueTypes.map(t => {
                                const info = getActionLabel(t); return (
                                    <button key={t} onClick={() => toggleType(t)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${filterTypes.has(t) ? 'bg-blue-600 text-white border-blue-400 shadow-lg' : 'bg-slate-800/60 text-white/70 border-white/10 hover:bg-slate-700/50'}`}>
                                        <span>{info.icon}</span>{info.label}{filterTypes.has(t) && <span className="ml-1 text-xs">✓</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-4">
                    <label className="text-sm font-semibold text-white flex items-center gap-2"><ArrowUpDown className="w-4 h-4" />Sort:</label>
                    {(['newest', 'oldest'] as const).map(o => (
                        <button key={o} onClick={() => setSortOrder(o)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${sortOrder === o ? 'bg-purple-600 text-white border-purple-400 shadow-lg' : 'bg-slate-800/60 text-white/70 border-white/10 hover:bg-slate-700/50'}`}>
                            {o === 'newest' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}{o === 'newest' ? 'Newest' : 'Oldest'} First
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-4 text-white/60 text-sm">Showing {filteredLogs.length} of {logs.length} logs</div>

            {filteredLogs.length === 0 ? <EmptyState icon={FileText} message={logs.length === 0 ? 'No audit logs found.' : 'No logs match the filter.'} /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredLogs.map((log, i) => {
                        const a = getActionLabel(log.actionType); return (
                            <div key={log.id} className="backdrop-blur-xl bg-slate-900/80 rounded-xl border border-white/10 overflow-hidden shadow-lg hover:bg-slate-800/80 animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                                <div className="px-4 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center"><User className="w-4 h-4 text-blue-400" /></div><span className="text-white font-bold">{log.username}</span></div>
                                    <span className="text-white/50 text-sm">{formatTime(log.createdAt)}</span>
                                </div>
                                <div className="px-4 py-3">
                                    <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">{a.icon}</div><span className={`font-bold text-lg ${a.color}`}>{a.label}</span></div>
                                    <div className="text-sm">{formatDetails(log.details)}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
