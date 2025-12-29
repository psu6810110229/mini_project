import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import type { Equipment } from '../types';

export default function EquipmentList() {
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchEquipments();
    }, []);

    const fetchEquipments = async () => {
        try {
            const response = await apiClient.get<Equipment[]>('/equipments');
            setEquipments(response.data);
        } catch (err) {
            setError('Failed to load equipments');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-white">Loading...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-8">Available Equipment</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {equipments.map((item) => (
                    <Link
                        key={item.id}
                        to={`/equipments/${item.id}`}
                        className="bg-gray-800 rounded-xl overflow-hidden hover:transform hover:scale-105 transition duration-300 border border-gray-700"
                    >
                        <div className="h-48 bg-gray-700 flex items-center justify-center">
                            {item.imageUrl ? (
                                <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-gray-500">No Image</span>
                            )}
                        </div>

                        <div className="p-6">
                            <div className="flex justify-between items-start mb-2">
                                <h2 className="text-xl font-semibold text-white">{item.name}</h2>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${item.status === 'AVAILABLE'
                                    ? 'bg-green-500/10 text-green-400'
                                    : 'bg-red-500/10 text-red-400'
                                    }`}>
                                    {item.status}
                                </span>
                            </div>

                            <p className="text-gray-400 text-sm mb-4">{item.category}</p>

                            <div className="flex justify-between items-center text-sm text-gray-400">
                                <span>Stock: {item.stockQty}</span>
                                <span className="text-blue-400 group-hover:underline">View Details →</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {equipments.length === 0 && (
                <div className="text-center text-gray-400 mt-12">
                    No equipment found. By default, there might be none.
                </div>
            )}
        </div>
    );
}
