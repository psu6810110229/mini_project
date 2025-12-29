import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import type { AuditLog } from '../types';

export default function AdminAuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await apiClient.get<AuditLog[]>('/audit-logs');
            // Sort by latest first
            const sorted = response.data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setLogs(sorted);
        } catch (err) {
            console.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    const formatDetails = (details?: string) => {
        if (!details) return '-';
        try {
            // If it looks like JSON, try to parse and display nicely
            const parsed = JSON.parse(details);
            return (
                <pre className="text-xs text-gray-400 overflow-x-auto">
                    {JSON.stringify(parsed, null, 2)}
                </pre>
            );
        } catch {
            return details;
        }
    };

    if (loading) return <div className="p-8 text-white">Loading...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">System Audit Logs</h1>
                <button
                    onClick={fetchLogs}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white transition-colors"
                >
                    Refresh
                </button>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
                <table className="w-full text-left">
                    <thead className="bg-gray-900/50 text-gray-400">
                        <tr>
                            <th className="p-4 w-48">Timestamp</th>
                            <th className="p-4 w-48">User</th>
                            <th className="p-4 w-32">Action</th>
                            <th className="p-4">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {logs.map((log) => (
                            <tr key={log.id} className="text-white hover:bg-gray-700/30 transition-colors">
                                <td className="p-4 text-sm text-gray-400 whitespace-nowrap">
                                    {new Date(log.createdAt).toLocaleString('th-TH')}
                                </td>
                                <td className="p-4">
                                    <div className="font-medium text-blue-400">{log.username}</div>
                                    <div className="text-xs text-gray-500">{log.userId.split('-')[0]}...</div>
                                </td>
                                <td className="p-4">
                                    <span className="px-2 py-1 bg-gray-700/50 rounded text-sm font-mono text-emerald-400 border border-gray-600/50">
                                        {log.actionType}
                                    </span>
                                </td>
                                <td className="p-4 text-sm font-mono text-gray-300">
                                    {formatDetails(log.details)}
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500">
                                    No audit logs found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
