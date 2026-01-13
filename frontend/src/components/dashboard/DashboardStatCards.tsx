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

    // Equipment Status - count equipments that have at least 1 available item
    const equipmentAvailable = equipments.filter(e => {
        // If equipment has items, check if any item is AVAILABLE
        if (e.items && e.items.length > 0) {
            return e.items.some(item => item.status === 'AVAILABLE');
        }
        // Fallback to equipment status if no items
        return e.status === 'AVAILABLE';
    }).length;

    // Total Users (who have rented)
    const uniqueUserIds = new Set(rentals.filter(r => r.user).map(r => r.user?.id));

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Calendar} label="ยืมวันนี้" value={todayRentals.length} sub={`${todayUniqueUsers} ผู้ใช้`} color="slate" />
            <StatCard icon={Activity} label="กำลังยืม" value={activeRentals.length} sub="รอดำเนินการ" color="slate" />
            <StatCard icon={Package} label="อุปกรณ์ทั้งหมด" value={equipments.length} sub={`${equipmentAvailable} ว่าง`} color="slate" />
            <StatCard icon={Users} label="ผู้ใช้ทั้งหมด" value={uniqueUserIds.size} sub="ที่เคยยืม" color="slate" />
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
