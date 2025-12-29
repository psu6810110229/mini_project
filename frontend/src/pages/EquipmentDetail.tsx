import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import type { Equipment } from '../types';

export default function EquipmentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [renting, setRenting] = useState(false);

    // Rental Form State
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [requestDetails, setRequestDetails] = useState('');
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
        fetchEquipment();
    }, [id]);

    const fetchEquipment = async () => {
        try {
            const response = await apiClient.get<Equipment>(`/equipments/${id}`);
            setEquipment(response.data);
        } catch (err) {
            setError('Failed to load equipment details');
        } finally {
            setLoading(false);
        }
    };

    const handleRent = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError('');

        // Add +07:00 for Thailand Time manually for MVP
        const start = new Date(startDate).toISOString();
        const end = new Date(endDate).toISOString();

        try {
            await apiClient.post('/rentals', {
                equipmentId: id,
                startDate: start,
                endDate: end,
                requestDetails,
                attachmentUrl: 'https://example.com/placeholder.jpg' // Hardcoded for MVP
            });
            alert('Rental request submitted successfully!');
            navigate('/my-rentals');
        } catch (err: any) {
            setSubmitError(err.response?.data?.message || 'Failed to submit rental request');
        }
    };

    if (loading) return <div className="p-8 text-center text-white">Loading...</div>;
    if (error || !equipment) return <div className="p-8 text-center text-red-500">{error || 'Equipment not found'}</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <button
                onClick={() => navigate('/equipments')}
                className="mb-8 text-gray-400 hover:text-white flex items-center gap-2"
            >
                ← Back to List
            </button>

            <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Image Section */}
                    <div className="h-64 md:h-auto bg-gray-700 flex items-center justify-center">
                        {equipment.imageUrl ? (
                            <img
                                src={equipment.imageUrl}
                                alt={equipment.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-gray-500 text-lg">No Image Available</span>
                        )}
                    </div>

                    {/* Details Section */}
                    <div className="p-8">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">{equipment.name}</h1>
                                <span className="text-gray-400 bg-gray-700 px-3 py-1 rounded-full text-sm">
                                    {equipment.category}
                                </span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${equipment.status === 'AVAILABLE'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                                }`}>
                                {equipment.status}
                            </span>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between py-3 border-b border-gray-700">
                                <span className="text-gray-400">Stock Quantity</span>
                                <span className="text-white font-medium">{equipment.stockQty} units</span>
                            </div>
                            {/* Description can be added here if available in entity */}
                        </div>

                        {renting ? (
                            <form onSubmit={handleRent} className="space-y-4 bg-gray-700/50 p-6 rounded-xl border border-gray-600">
                                <h3 className="text-lg font-semibold text-white mb-4">Submit Rental Request</h3>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="w-full bg-gray-800 border-gray-600 rounded text-white p-2"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">End Date</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="w-full bg-gray-800 border-gray-600 rounded text-white p-2"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Reason / Details</label>
                                    <textarea
                                        required
                                        className="w-full bg-gray-800 border-gray-600 rounded text-white p-2 h-24"
                                        value={requestDetails}
                                        onChange={(e) => setRequestDetails(e.target.value)}
                                        placeholder="e.g. For verify project photography"
                                    />
                                </div>

                                {submitError && (
                                    <div className="text-red-400 text-sm bg-red-500/10 p-2 rounded">
                                        {submitError}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setRenting(false)}
                                        className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-white font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-medium"
                                    >
                                        Confirm Request
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <button
                                onClick={() => setRenting(true)}
                                disabled={equipment.status !== 'AVAILABLE'}
                                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${equipment.status === 'AVAILABLE'
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                {equipment.status === 'AVAILABLE' ? 'Rent this Equipment' : 'Currently Unavailable'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
