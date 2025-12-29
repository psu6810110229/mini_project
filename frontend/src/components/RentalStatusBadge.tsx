interface RentalStatusBadgeProps {
    status: string;
    className?: string;
}

export default function RentalStatusBadge({ status, className = '' }: RentalStatusBadgeProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING':
                return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
            case 'APPROVED':
                return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
            case 'CHECKED_OUT':
                return 'bg-purple-500/20 text-purple-500 border-purple-500/30';
            case 'RETURNED':
                return 'bg-green-500/20 text-green-500 border-green-500/30';
            case 'REJECTED':
                return 'bg-red-500/20 text-red-500 border-red-500/30';
            case 'CANCELLED':
                return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
            default:
                return 'bg-gray-700 text-gray-400 border-gray-600';
        }
    };

    return (
        <span className={`px-2 py-1 rounded text-xs font-bold border ${getStatusColor(status)} ${className}`}>
            {status}
        </span>
    );
}
