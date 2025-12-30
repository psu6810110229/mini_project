import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import type { Rental } from '../types';

export default function MyRentals() {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchMyRentals();
    }, []);

    const fetchMyRentals = async () => {
        try {
            const response = await apiClient.get<Rental[]>('/rentals/me');
            setRentals(response.data);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || err.message || 'Failed to load your rentals');
        } finally {
            setLoading(false);
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
    if (error) return <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center"><div className="text-red-600">{error}</div></div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <div className="p-8 max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">My Rental History</h1>

                <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-gray-300/40 overflow-hidden shadow-lg">
                    {rentals.length === 0 ? (
                        <div className="p-8 text-center text-gray-600">
                            You haven't rented any equipment yet.
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gradient-to-r from-gray-200/60 to-gray-300/60 backdrop-blur border-b border-gray-300">
                                <tr>
                                    <th className="p-4 text-gray-700 font-bold">Equipment</th>
                                    <th className="p-4 text-gray-700 font-bold">Start Date</th>
                                    <th className="p-4 text-gray-700 font-bold">End Date</th>
                                    <th className="p-4 text-gray-700 font-bold">Status</th>
                                    <th className="p-4 text-gray-700 font-bold">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-300">
                                {rentals.map((rental) => (
                                    <tr key={rental.id} className="text-gray-800 hover:bg-gray-100/50 transition-colors">
                                        <td className="p-4 font-medium flex items-center gap-3">
                                            {rental.equipment?.imageUrl && (
                                                <img src={rental.equipment.imageUrl} alt="" className="w-10 h-10 rounded object-contain border border-gray-300 bg-white" />
                                            )}
                                            <div>
                                                <div>{rental.equipment?.name || 'Unknown Equipment'}</div>
                                                {(rental as any).equipmentItem?.itemCode && (
                                                    <div className="text-xs text-gray-500">ID: {(rental as any).equipmentItem.itemCode}</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-600">{new Date(rental.startDate).toLocaleString('th-TH')}</td>
                                        <td className="p-4 text-gray-600">{new Date(rental.endDate).toLocaleString('th-TH')}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(rental.status)}`}>
                                                {rental.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-600 text-sm max-w-xs truncate">
                                            {rental.requestDetails || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
