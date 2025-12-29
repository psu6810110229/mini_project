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
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">My Rental History</h1>

            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                {rentals.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        You haven't rented any equipment yet.
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-900/50 text-gray-400">
                            <tr>
                                <th className="p-4">Equipment</th>
                                <th className="p-4">Start Date</th>
                                <th className="p-4">End Date</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {rentals.map((rental) => (
                                <tr key={rental.id} className="text-white hover:bg-gray-700/30">
                                    <td className="p-4 font-medium flex items-center gap-3">
                                        {rental.equipment?.imageUrl && (
                                            <img src={rental.equipment.imageUrl} alt="" className="w-10 h-10 rounded object-cover" />
                                        )}
                                        {rental.equipment?.name || 'Unknown Equipment'}
                                    </td>
                                    <td className="p-4 text-gray-400">{new Date(rental.startDate).toLocaleString('th-TH')}</td>
                                    <td className="p-4 text-gray-400">{new Date(rental.endDate).toLocaleString('th-TH')}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(rental.status)}`}>
                                            {rental.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-400 text-sm max-w-xs truncate">
                                        {rental.requestDetails || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
