import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import type { Rental } from '../types';

export default function AdminRentals() {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRentals();
    }, []);

    const fetchRentals = async () => {
        try {
            const response = await apiClient.get<Rental[]>('/rentals');
            // Sort by latest first
            const sorted = response.data.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
            setRentals(sorted);
        } catch (err) {
            console.error('Failed to load rentals');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        if (!confirm(`Are you sure you want to update status to ${newStatus}?`)) return;
        try {
            await apiClient.patch(`/rentals/${id}/status`, { status: newStatus });
            fetchRentals(); // Refresh list
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-500/20 text-yellow-500';
            case 'APPROVED': return 'bg-green-500/20 text-green-500';
            case 'CHECKED_OUT': return 'bg-blue-500/20 text-blue-500';
            case 'RETURNED': return 'bg-gray-500/20 text-gray-500';
            case 'REJECTED': return 'bg-red-500/20 text-red-500';
            case 'CANCELLED': return 'bg-red-500/20 text-red-500';
            default: return 'bg-gray-700 text-gray-400';
        }
    };

    if (loading) return <div className="p-8 text-white">Loading...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">Manage Rentals</h1>

            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
                <table className="w-full text-left">
                    <thead className="bg-gray-900/50 text-gray-400">
                        <tr>
                            <th className="p-4">User</th>
                            <th className="p-4">Equipment</th>
                            <th className="p-4">Duration</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {rentals.map((rental: any) => (
                            <tr key={rental.id} className="text-white hover:bg-gray-700/30">
                                <td className="p-4">
                                    <div className="font-medium">{rental.user?.name || 'Unknown'}</div>
                                    <div className="text-xs text-gray-500">{rental.user?.studentId}</div>
                                </td>
                                <td className="p-4">
                                    <span className="font-medium">{rental.equipment?.name}</span>
                                </td>
                                <td className="p-4 text-sm text-gray-400">
                                    <div>From: {new Date(rental.startDate).toLocaleString('th-TH')}</div>
                                    <div>To: {new Date(rental.endDate).toLocaleString('th-TH')}</div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(rental.status)}`}>
                                        {rental.status}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex justify-center gap-2">
                                        {rental.status === 'PENDING' && (
                                            <>
                                                <button
                                                    onClick={() => updateStatus(rental.id, 'APPROVED')}
                                                    className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => updateStatus(rental.id, 'REJECTED')}
                                                    className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        {rental.status === 'APPROVED' && (
                                            <button
                                                onClick={() => updateStatus(rental.id, 'CHECKED_OUT')}
                                                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm"
                                            >
                                                Checkout
                                            </button>
                                        )}
                                        {rental.status === 'CHECKED_OUT' && (
                                            <button
                                                onClick={() => updateStatus(rental.id, 'RETURNED')}
                                                className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm"
                                            >
                                                Return
                                            </button>
                                        )}
                                        {['RETURNED', 'REJECTED', 'CANCELLED'].includes(rental.status) && (
                                            <span className="text-gray-600 text-sm italic">Completed</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
