import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import type { AuditLog } from '../types';

export default function AdminAuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterActionType, setFilterActionType] = useState('');
    const [searchUser, setSearchUser] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await apiClient.get<AuditLog[]>('/audit-logs');
            // Sort by latest first
            const sorted = response.data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setLogs(sorted);
            setFilteredLogs(sorted);
        } catch (err) {
            console.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let filtered = [...logs];
        if (filterActionType) {
            filtered = filtered.filter(log => log.actionType.toLowerCase().includes(filterActionType.toLowerCase()));
        }
        if (searchUser) {
            filtered = filtered.filter(log => 
                log.username.toLowerCase().includes(searchUser.toLowerCase()) ||
                log.userId.toLowerCase().includes(searchUser.toLowerCase())
            );
        }
        setFilteredLogs(filtered);
    }, [logs, filterActionType, searchUser]);

    const formatDetails = (details?: string) => {
        if (!details) return '-';
        try {
            // If it looks like JSON, try to parse and display nicely
            const parsed = JSON.parse(details);
            return (
                <pre className="text-xs text-gray-600 overflow-x-auto">
                    {JSON.stringify(parsed, null, 2)}
                </pre>
            );
        } catch {
            return details;
        }
    };

    if (loading) return <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center"><div className="text-gray-700">Loading...</div></div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900">System Audit Logs</h1>
                    <button
                        onClick={fetchLogs}
                        className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg text-sm text-gray-900 font-semibold transition-colors"
                    >
                        Refresh
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-gray-300/40 shadow-lg p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Search User</label>
                            <input
                                type="text"
                                value={searchUser}
                                onChange={(e) => setSearchUser(e.target.value)}
                                placeholder="Search by username or user ID..."
                                className="w-full bg-white/70 border border-gray-300 rounded-lg text-gray-900 p-2 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Filter by Action Type</label>
                            <input
                                type="text"
                                value={filterActionType}
                                onChange={(e) => setFilterActionType(e.target.value)}
                                placeholder="Filter by action type..."
                                className="w-full bg-white/70 border border-gray-300 rounded-lg text-gray-900 p-2 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-500"
                            />
                        </div>
                    </div>
                </div>

            <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-gray-300/40 overflow-hidden shadow-lg">
                <table className="w-full text-left">
                    <thead className="bg-gradient-to-r from-gray-200/70 to-gray-300/70 backdrop-blur border-b border-gray-300">
                        <tr>
                            <th className="p-4 w-48 text-gray-700 font-bold">Timestamp</th>
                            <th className="p-4 w-48 text-gray-700 font-bold">User</th>
                            <th className="p-4 w-32 text-gray-700 font-bold">Action</th>
                            <th className="p-4 text-gray-700 font-bold">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-300">
                        {filteredLogs.map((log) => (
                            <tr key={log.id} className="text-gray-800 hover:bg-gray-100/50 transition-colors">
                                <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                                    {new Date(log.createdAt).toLocaleString('th-TH')}
                                </td>
                                <td className="p-4">
                                    <div className="font-medium text-gray-700">{log.username}</div>
                                    <div className="text-xs text-gray-600">{log.userId.split('-')[0]}...</div>
                                </td>
                                <td className="p-4">
                                    <span className="px-2 py-1 bg-gray-200/70 rounded-lg text-sm font-mono text-gray-700 border border-gray-300/50">
                                        {log.actionType}
                                    </span>
                                </td>
                                <td className="p-4 text-sm font-mono text-gray-700">
                                    {formatDetails(log.details)}
                                </td>
                            </tr>
                        ))}
                        {filteredLogs.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-600">
                                    {logs.length === 0 ? 'No audit logs found.' : 'No logs match the filter criteria.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            </div>
        </div>
    );
}
