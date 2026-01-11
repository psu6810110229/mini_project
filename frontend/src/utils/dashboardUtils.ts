// ===== ACTION TYPE LABELS =====
// Maps internal action codes to user-friendly labels for audit logs
export const ACTION_MAP: Record<string, { label: string; icon: string; color: string; category: string }> = {
    'LOGIN': { label: 'User Login', icon: '🔐', color: 'text-blue-400', category: 'User' },
    'REGISTER': { label: 'New User', icon: '👤', color: 'text-green-400', category: 'User' },
    'RENTAL_CREATE': { label: 'Rental Request', icon: '📋', color: 'text-blue-400', category: 'Rental' },
    'RENTAL_STATUS_APPROVED': { label: 'Approved', icon: '✅', color: 'text-green-400', category: 'Rental' },
    'RENTAL_STATUS_REJECTED': { label: 'Rejected', icon: '❌', color: 'text-red-400', category: 'Rental' },
    'RENTAL_STATUS_CHECKED_OUT': { label: 'Checked Out', icon: '📤', color: 'text-blue-400', category: 'Rental' },
    'RENTAL_STATUS_RETURNED': { label: 'Returned', icon: '📥', color: 'text-green-400', category: 'Rental' },
    'RENTAL_STATUS_CANCELLED': { label: 'Cancelled', icon: '🚫', color: 'text-orange-400', category: 'Rental' },
    'RENTAL_AUTO_REJECTED': { label: 'Auto-Rejected', icon: '⚠️', color: 'text-orange-400', category: 'Rental' },
    'RENTAL_AUTO_CANCELLED': { label: 'Auto-Cancelled', icon: '🔄', color: 'text-orange-400', category: 'Rental' },
    'EQUIPMENT_CREATE': { label: 'Equipment Added', icon: '📦', color: 'text-green-400', category: 'Equipment' },
    'EQUIPMENT_UPDATE': { label: 'Equipment Updated', icon: '✏️', color: 'text-yellow-400', category: 'Equipment' },
    'EQUIPMENT_DELETE': { label: 'Equipment Deleted', icon: '🗑️', color: 'text-red-400', category: 'Equipment' },
    'EQUIPMENT_ITEM_STATUS_UPDATE': { label: 'Item Status Changed', icon: '🔄', color: 'text-purple-400', category: 'Equipment' },
};

export const getActionLabel = (type: string) => ACTION_MAP[type] || { label: type.replace(/_/g, ' '), icon: '📝', color: 'text-gray-400', category: 'Other' };

export const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
};

// Parse details JSON safely
export const parseDetails = (details?: string) => {
    if (!details) return null;
    try { return JSON.parse(details); } catch { return null; }
};
