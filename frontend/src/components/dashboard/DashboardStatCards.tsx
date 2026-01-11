import { Calendar, Activity, Package, Users } from 'lucide-react';
import type { Rental, Equipment } from '../../types';

interface StatCardsProps {
    rentals: Rental[];
    equipments: Equipment[];
    logsCount: number; // For total users calculation logic approximation or pass pre-calculated
}

export default function DashboardStatCards({ rentals, equipments }: StatCardsProps) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's rentals (unique users who made requests today)
    const todayRentals = rentals.filter(r => new Date(r.startDate) >= today || new Date(r.endDate) >= today);
    const todayUniqueUsers = new Set(todayRentals.map(r => r.user?.id)).size;

    // Active rentals (not returned/rejected/cancelled)
    const activeRentals = rentals.filter(r => ['PENDING', 'APPROVED', 'CHECKED_OUT'].includes(r.status));

    // Equipment Status
    const equipmentAvailable = equipments.filter(e => e.status === 'AVAILABLE').length;

    // Total Users (who have rented)
    const uniqueUserIds = new Set(rentals.filter(r => r.user).map(r => r.user?.id));

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Calendar} label="Today's Rentals" value={todayRentals.length} sub={`${todayUniqueUsers} unique users`} color="slate" />
            <StatCard icon={Activity} label="Active Rentals" value={activeRentals.length} sub="pending/approved/checked out" color="slate" />
            <StatCard icon={Package} label="Total Equipment" value={equipments.length} sub={`${equipmentAvailable} available`} color="slate" />
            <StatCard icon={Users} label="Total Users" value={uniqueUserIds.size} sub="who have rented" color="slate" />
        </div>
    );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: number; sub: string; color: string }) {
    return (
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl p-4 border border-white/10 shadow-lg">
            <div className="flex items-center gap-2 text-white/70 mb-1">
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{label}</span>
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
            <p className="text-xs text-white/50">{sub}</p>
        </div>
    );
}
