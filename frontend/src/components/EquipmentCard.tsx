import { Link } from 'react-router-dom';
import type { Equipment } from '../types';

interface EquipmentCardProps {
    equipment: Equipment;
    linkTo?: string;
}

export default function EquipmentCard({ equipment, linkTo }: EquipmentCardProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'AVAILABLE':
                return 'bg-green-500/10 text-green-400 border-green-500/30';
            case 'MAINTENANCE':
                return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
            case 'UNAVAILABLE':
                return 'bg-red-500/10 text-red-400 border-red-500/30';
            default:
                return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
        }
    };

    const CardContent = (
        <>
            <div className="h-48 bg-gray-700 flex items-center justify-center overflow-hidden">
                {equipment.imageUrl ? (
                    <img
                        src={equipment.imageUrl}
                        alt={equipment.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=No+Image';
                        }}
                    />
                ) : (
                    <span className="text-gray-500">ไม่มีรูป</span>
                )}
            </div>

            <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-semibold text-white">{equipment.name}</h2>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(equipment.status)}`}>
                        {equipment.status}
                    </span>
                </div>

                <p className="text-gray-400 text-sm mb-4">{equipment.category || 'ไม่มีหมวด'}</p>

                <div className="flex justify-between items-center text-sm text-gray-400">
                    <span>จำนวน: {equipment.stockQty}</span>
                    {linkTo && <span className="text-blue-400">ดูรายละเอียด ›</span>}
                </div>
            </div>
        </>
    );

    if (linkTo) {
        return (
            <Link
                to={linkTo}
                className="bg-gray-800 rounded-xl overflow-hidden hover:transform hover:scale-105 transition duration-300 border border-gray-700"
            >
                {CardContent}
            </Link>
        );
    }

    return (
        <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
            {CardContent}
        </div>
    );
}
