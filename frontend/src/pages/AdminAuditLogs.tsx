import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import type { AuditLog } from '../types';
import { FileText, Search, Filter, User, Calendar, Activity, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export default function AdminAuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterActionType, setFilterActionType] = useState('');
    const [searchUser, setSearchUser] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await apiClient.get<AuditLog[]>('/audit-logs');
            setLogs(response.data);
        } catch (err) {
            console.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let filtered = [...logs];

        // Filter by action type - match exact action type value
        if (filterActionType) {
            filtered = filtered.filter(log => log.actionType === filterActionType);
        }

        // Filter by user
        if (searchUser) {
            filtered = filtered.filter(log =>
                log.username.toLowerCase().includes(searchUser.toLowerCase()) ||
                log.userId.toLowerCase().includes(searchUser.toLowerCase())
            );
        }

        // Sort
        filtered.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        setFilteredLogs(filtered);
    }, [logs, filterActionType, searchUser, sortOrder]);

    // Make action types more readable for non-developers
    const getActionLabel = (actionType: string) => {
        const actionMap: Record<string, { label: string; icon: string; color: string }> = {
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

        return actionMap[actionType] || { label: actionType, icon: '📝', color: 'text-gray-400' };
    };

    // Get unique action types from logs
    const uniqueActionTypes = Array.from(new Set(logs.map(log => log.actionType)));

    // Format details for easy reading
    const formatDetails = (details?: string) => {
        if (!details) return null;

        try {
            const parsed = JSON.parse(details);
            const displayItems: { label: string; value: string }[] = [];

            if (parsed.equipmentName) {
                displayItems.push({ label: 'Equipment', value: parsed.equipmentName });
            }
            if (parsed.itemCode) {
                displayItems.push({ label: 'Item Code', value: parsed.itemCode });
            }
            if (parsed.oldStatus && parsed.newStatus) {
                displayItems.push({ label: 'Status Change', value: `${parsed.oldStatus} → ${parsed.newStatus}` });
            }
            if (parsed.status && !parsed.oldStatus) {
                displayItems.push({ label: 'Status', value: parsed.status });
            }
            if (parsed.rentalId) {
                displayItems.push({ label: 'Rental ID', value: parsed.rentalId.substring(0, 8) + '...' });
            }
            if (parsed.startDate) {
                displayItems.push({ label: 'Start', value: new Date(parsed.startDate).toLocaleDateString() });
            }
            if (parsed.endDate) {
                displayItems.push({ label: 'End', value: new Date(parsed.endDate).toLocaleDateString() });
            }
            if (parsed.reason) {
                displayItems.push({ label: 'Reason', value: parsed.reason });
            }
            if (parsed.category) {
                displayItems.push({ label: 'Category', value: parsed.category });
            }
            if (parsed.stockQty) {
                displayItems.push({ label: 'Quantity', value: `${parsed.stockQty} items` });
            }

            if (displayItems.length === 0) {
                return <span className="text-white/50 text-sm">No additional details</span>;
            }

            return (
                <div className="flex flex-wrap gap-2">
                    {displayItems.map((item, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-xs">
                            <span className="text-white/50">{item.label}:</span>
                            <span className="text-white/80 font-medium">{item.value}</span>
                        </span>
                    ))}
                </div>
            );
        } catch {
            return <span className="text-white/50 text-sm">{details}</span>;
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} min ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl p-8 border border-white/20 shadow-xl">
                    <div className="flex items-center gap-3">
                        <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-white font-medium">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <Activity className="w-8 h-8 text-white" />
                <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>
                    System Audit Logs
                </h1>
            </div>

            {/* Filters */}
            <div className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl border border-white/20 shadow-xl p-4 md:p-6 mb-8 transition-all duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="group">
                        <label className="block text-sm font-semibold text-white mb-2 transition-colors group-focus-within:text-blue-400">
                            <User className="inline w-4 h-4 mr-1" /> Search User
                        </label>
                        <input
                            type="text"
                            value={searchUser}
                            onChange={(e) => setSearchUser(e.target.value)}
                            placeholder="Type username or user ID..."
                            className="w-full backdrop-blur-xl bg-slate-800/60 border border-white/20 rounded-xl py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                        />
                    </div>
                    <div className="group">
                        <label className="block text-sm font-semibold text-white mb-2 transition-colors group-focus-within:text-blue-400">
                            <Filter className="inline w-4 h-4 mr-1" /> Filter by Type
                        </label>
                        <div className="relative">
                            <select
                                value={filterActionType}
                                onChange={(e) => setFilterActionType(e.target.value)}
                                className="w-full backdrop-blur-xl bg-slate-800/60 border border-white/20 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 cursor-pointer appearance-none"
                                style={{ colorScheme: 'dark' }}
                            >
                                <option value="" className="bg-slate-800">All Types</option>
                                {uniqueActionTypes.map(actionType => {
                                    const info = getActionLabel(actionType);
                                    return (
                                        <option key={actionType} value={actionType} className="bg-slate-800">
                                            {info.icon} {info.label}
                                        </option>
                                    );
                                })}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="group">
                        <label className="block text-sm font-semibold text-white mb-2">
                            <ArrowUpDown className="inline w-4 h-4 mr-1" /> Sort Order
                        </label>
                        <div className="relative">
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                                className="w-full backdrop-blur-xl bg-slate-800/60 border border-white/20 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 cursor-pointer appearance-none"
                                style={{ colorScheme: 'dark' }}
                            >
                                <option value="newest" className="bg-slate-800">Newest First</option>
                                <option value="oldest" className="bg-slate-800">Oldest First</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                {sortOrder === 'newest' ? (
                                    <ArrowDown className="w-4 h-4 text-white/60" />
                                ) : (
                                    <ArrowUp className="w-4 h-4 text-white/60" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active filters summary */}
                {(filterActionType || searchUser) && (
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 flex-wrap">
                        <span className="text-white/50 text-sm">Active filters:</span>
                        {filterActionType && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-xs">
                                {getActionLabel(filterActionType).icon} {getActionLabel(filterActionType).label}
                                <button onClick={() => setFilterActionType('')} className="ml-1 hover:text-white">×</button>
                            </span>
                        )}
                        {searchUser && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs">
                                User: {searchUser}
                                <button onClick={() => setSearchUser('')} className="ml-1 hover:text-white">×</button>
                            </span>
                        )}
                        <button
                            onClick={() => { setFilterActionType(''); setSearchUser(''); }}
                            className="text-xs text-white/50 hover:text-white underline"
                        >
                            Clear all
                        </button>
                    </div>
                )}
            </div>

            {/* Results count */}
            <div className="mb-4 text-white/60 text-sm">
                Showing {filteredLogs.length} of {logs.length} logs
            </div>

            {/* Logs as Cards */}
            <div className="space-y-4">
                {filteredLogs.map((log, index) => {
                    const action = getActionLabel(log.actionType);
                    return (
                        <div
                            key={log.id}
                            className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl border border-white/20 p-5 shadow-xl transition-all duration-300 hover:bg-slate-800/60 animate-fade-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl">
                                    {action.icon}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <span className={`font-bold ${action.color}`}>
                                            {action.label}
                                        </span>
                                        <span className="text-white/50 text-sm flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {formatTime(log.createdAt)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                            <User className="w-3 h-3 text-white/60" />
                                        </div>
                                        <span className="text-white font-medium">{log.username}</span>
                                    </div>

                                    {formatDetails(log.details)}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filteredLogs.length === 0 && (
                    <div className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl border border-white/20 p-12 text-center shadow-xl">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-white/30" />
                        <p className="text-white/60 text-lg">
                            {logs.length === 0 ? 'No audit logs found.' : 'No logs match the filter criteria.'}
                        </p>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
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
