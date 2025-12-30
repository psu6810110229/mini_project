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
            case 'PENDING': return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
            case 'APPROVED': return 'bg-green-100 text-green-700 border border-green-200';
            case 'CHECKED_OUT': return 'bg-blue-100 text-blue-700 border border-blue-200';
            case 'RETURNED': return 'bg-gray-100 text-gray-700 border border-gray-200';
            case 'REJECTED': return 'bg-red-100 text-red-700 border border-red-200';
            case 'CANCELLED': return 'bg-red-100 text-red-700 border border-red-200';
            default: return 'bg-gray-100 text-gray-700 border border-gray-200';
        }
    };

    if (loading) return <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center"><div className="text-gray-700">Loading...</div></div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <div className="p-8 max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">Manage Rentals</h1>

                <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-gray-300/40 overflow-hidden shadow-lg">
                    <table className="w-full text-left">
                        <thead className="bg-gradient-to-r from-gray-200/70 to-gray-300/70 backdrop-blur border-b border-gray-300">
                            <tr>
                                <th className="p-4 text-gray-700 font-bold">User</th>
                                <th className="p-4 text-gray-700 font-bold">Equipment</th>
                                <th className="p-4 text-gray-700 font-bold">Duration</th>
                                <th className="p-4 text-gray-700 font-bold">Status</th>
                                <th className="p-4 text-center text-gray-700 font-bold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-300">
                            {rentals.map((rental: any) => (
                                <tr key={rental.id} className="text-gray-800 hover:bg-gray-100/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-medium">{rental.user?.name || 'Unknown'}</div>
                                        <div className="text-xs text-gray-600">{rental.user?.studentId}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="font-medium">{rental.equipment?.name}</span>
                                        {rental.equipmentItem?.itemCode && (
                                            <span className="ml-2 text-xs text-gray-500">(ID: {rental.equipmentItem.itemCode})</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">
                                        <div>From: {new Date(rental.startDate).toLocaleString('th-TH')}</div>
                                        <div>To: {new Date(rental.endDate).toLocaleString('th-TH')}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(rental.status)}`}>
                                            {rental.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            {rental.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => updateStatus(rental.id, 'APPROVED')}
                                                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-semibold transition-colors"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => updateStatus(rental.id, 'REJECTED')}
                                                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-semibold transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {rental.status === 'APPROVED' && (
                                                <button
                                                    onClick={() => updateStatus(rental.id, 'CHECKED_OUT')}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-semibold transition-colors"
                                                >
                                                    Checkout
                                                </button>
                                            )}
                                            {rental.status === 'CHECKED_OUT' && (
                                                <button
                                                    onClick={() => updateStatus(rental.id, 'RETURNED')}
                                                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-lg text-sm font-semibold transition-colors"
                                                >
                                                    Return
                                                </button>
                                            )}
                                            {['RETURNED', 'REJECTED', 'CANCELLED'].includes(rental.status) && (
                                                <span className="text-gray-500 text-sm italic">Completed</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
