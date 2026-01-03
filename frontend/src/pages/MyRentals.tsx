import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import type { Rental } from '../types';
import { History, Package, Calendar, FileText, Clock } from 'lucide-react';

export default function MyRentals() {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => { fetchMyRentals(); }, []);

    const fetchMyRentals = async () => {
        try {
            const response = await apiClient.get<Rental[]>('/rentals/me');
            const sorted = response.data.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
            setRentals(sorted);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load your rentals');
        } finally { setLoading(false); }
    };

    const getStatusInfo = (status: string) => {
        const map: Record<string, { label: string; color: string; icon: string }> = {
            'PENDING': { label: 'Pending', color: 'bg-yellow-600', icon: '⏳' },
            'APPROVED': { label: 'Approved', color: 'bg-green-600', icon: '✓' },
            'CHECKED_OUT': { label: 'Checked Out', color: 'bg-blue-600', icon: '📤' },
            'RETURNED': { label: 'Returned', color: 'bg-gray-600', icon: '📥' },
            'REJECTED': { label: 'Rejected', color: 'bg-red-600', icon: '✗' },
            'CANCELLED': { label: 'Cancelled', color: 'bg-red-600', icon: '🚫' },
        };
        return map[status] || { label: status, color: 'bg-gray-600', icon: '?' };
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const getDaysRemaining = (endDate: string, status: string) => {
        if (!['APPROVED', 'CHECKED_OUT'].includes(status)) return null;
        const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
        if (diff < 0) return { text: 'Overdue', color: 'text-red-400' };
        if (diff === 0) return { text: 'Due today', color: 'text-amber-400' };
        return { text: `${diff} day${diff > 1 ? 's' : ''} left`, color: 'text-green-400' };
    };

    if (loading) return <div className="min-h-[80vh] flex items-center justify-center"><div className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl p-8 border border-white/20 shadow-xl"><span className="text-white">Loading...</span></div></div>;
    if (error) return <div className="min-h-[80vh] flex items-center justify-center"><div className="backdrop-blur-2xl bg-red-900/50 rounded-2xl p-8 border border-red-500/30 shadow-xl"><p className="text-red-200">{error}</p></div></div>;

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <History className="w-8 h-8 text-white" />
                <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>My Rental History</h1>
            </div>

            {rentals.length === 0 ? (
                <div className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl border border-white/20 p-12 text-center shadow-xl">
                    <Package className="w-16 h-16 mx-auto mb-4 text-white/30" />
                    <h3 className="text-xl font-semibold text-white mb-2">No rental history yet</h3>
                    <p className="text-white/50">Select equipment from the list to start renting</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {rentals.map((rental: any, idx) => {
                        const st = getStatusInfo(rental.status);
                        const days = getDaysRemaining(rental.endDate, rental.status);
                        return (
                            <div key={rental.id} className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl border border-white/20 overflow-hidden shadow-xl transition-all duration-300 hover:bg-slate-800/60" style={{ animationDelay: `${idx * 50}ms` }}>
                                <div className="flex flex-col md:flex-row">
                                    <div className="md:w-32 h-32 flex-shrink-0 bg-white flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-white/10">
                                        {rental.equipment?.imageUrl ? <img src={rental.equipment.imageUrl} alt="" className="w-full h-full object-contain p-2" /> : <Package className="w-10 h-10 text-gray-400" />}
                                    </div>
                                    <div className="flex-1 p-5">
                                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                                            <div><h3 className="font-bold text-white text-lg">{rental.equipment?.name || 'Unknown'}</h3>{rental.equipmentItem?.itemCode && <p className="text-white/50 text-sm">ID: {rental.equipmentItem.itemCode}</p>}</div>
                                            <span className={`px-3 py-1.5 rounded-full text-sm font-bold text-white ${st.color}`}>{st.icon} {st.label}</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                            <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-white/50" /><span className="text-white/50">Start:</span><span className="text-white">{formatDate(rental.startDate)}</span></div>
                                            <div className="flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-white/50" /><span className="text-white/50">End:</span><span className="text-white">{formatDate(rental.endDate)}</span></div>
                                        </div>
                                        {days && <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-sm ${days.color}`}>⏰ {days.text}</div>}
                                        {rental.requestDetails && <div className="mt-3 pt-3 border-t border-white/10"><div className="flex items-start gap-2"><FileText className="w-4 h-4 text-white/50 mt-0.5" /><p className="text-sm text-white/60">{rental.requestDetails}</p></div></div>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
