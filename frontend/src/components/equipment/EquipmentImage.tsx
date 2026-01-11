import { Check, Package } from 'lucide-react';
import type { Equipment } from '../../types';

interface EquipmentImageProps {
    equipment: Equipment;
    addedMessage: string;
}

export default function EquipmentImage({ equipment, addedMessage }: EquipmentImageProps) {
    return (
        <div className="relative h-64 md:h-auto bg-white flex items-center justify-center border-b md:border-b-0 md:border-r border-white/10">
            {equipment.imageUrl ? (
                <img
                    src={equipment.imageUrl}
                    alt={equipment.name}
                    className="w-full h-full object-contain p-8 hover:scale-110 transition-transform duration-500"
                />
            ) : (
                <Package className="w-16 h-16 text-gray-400" />
            )}
            {/* Success Message Toast */}
            {addedMessage && (
                <div className="absolute bottom-4 left-4 right-4 flex gap-2 items-center backdrop-blur-xl bg-green-600/90 rounded-xl px-4 py-3 shadow-lg animate-slide-in">
                    <Check className="h-5 w-5 text-white" />
                    <p className="text-white font-semibold text-sm">{addedMessage}</p>
                </div>
            )}
        </div>
    );
}
