/**
 * Status Helpers - Utility Functions for Rental Status
 * 
 * These functions centralize the logic for displaying rental status.
 * Instead of repeating these mappings in every component, we define them once here.
 * 
 * WHY THIS FILE EXISTS:
 * - DRY Principle (Don't Repeat Yourself)
 * - Single source of truth for status colors and labels
 * - Easy to update if business requirements change
 * 
 * USAGE:
 *   import { getStatusLabel, getStatusColor } from '../utils/statusHelpers';
 *   
 *   const label = getStatusLabel('PENDING');  // Returns "Pending"
 *   const color = getStatusColor('APPROVED'); // Returns 'bg-green-600 text-white'
 */

/**
 * Converts status code to human-readable label
 * 
 * @param status - Status code from database (e.g., 'PENDING', 'APPROVED')
 * @returns Human-readable label (e.g., 'Pending', 'Approved')
 * 
 * EXAMPLE:
 *   getStatusLabel('CHECKED_OUT') → 'Checked Out'
 */
export const getStatusLabel = (status: string): string => {
    // Object lookup is faster than switch/case or if/else chains
    const labels: Record<string, string> = {
        PENDING: 'Pending',
        APPROVED: 'Approved',
        CHECKED_OUT: 'Checked Out',
        RETURNED: 'Returned',
        REJECTED: 'Rejected',
        CANCELLED: 'Cancelled',
    };
    // If status not found in map, return the original status
    return labels[status] || status;
};

/**
 * Gets Tailwind CSS classes for status badge background
 * 
 * @param status - Status code from database
 * @returns Tailwind CSS classes for background and text color
 * 
 * TAILWIND COLOR MEANINGS:
 * - Yellow = Waiting/Pending (needs action)
 * - Green = Success/Approved (positive)
 * - Blue = Active/In Progress
 * - Gray = Completed/Done
 * - Red = Error/Rejected/Cancelled (negative)
 */
export const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
        PENDING: 'bg-yellow-600 text-white',    // Yellow = waiting for approval
        APPROVED: 'bg-green-600 text-white',    // Green = approved, ready to pickup
        CHECKED_OUT: 'bg-blue-600 text-white',  // Blue = currently in use
        RETURNED: 'bg-gray-600 text-white',     // Gray = completed
        REJECTED: 'bg-red-600 text-white',      // Red = denied
        CANCELLED: 'bg-red-600 text-white',     // Red = cancelled by user
    };
    return colors[status] || 'bg-gray-600 text-white';
};

/**
 * Gets border color for status (used in cards for visual separation)
 * 
 * @param status - Status code from database
 * @returns Tailwind CSS classes for border color
 */
export const getStatusBorderColor = (status: string): string => {
    const borders: Record<string, string> = {
        PENDING: 'border-yellow-500/30',
        APPROVED: 'border-green-500/30',
        CHECKED_OUT: 'border-blue-500/30',
        RETURNED: 'border-gray-500/30',
        REJECTED: 'border-red-500/30',
        CANCELLED: 'border-red-500/30',
    };
    return borders[status] || 'border-white/20';
};

/**
 * Gets action button label based on current status
 * 
 * STATUS TRANSITIONS (State Machine):
 *   PENDING → Approve/Reject → APPROVED or REJECTED
 *   APPROVED → Checkout → CHECKED_OUT
 *   CHECKED_OUT → Return → RETURNED
 * 
 * @param status - Current status
 * @returns Label for the action button
 */
export const getActionLabel = (status: string): string => {
    const actions: Record<string, string> = {
        PENDING: 'Approve',
        APPROVED: 'Checkout',
        CHECKED_OUT: 'Return',
    };
    return actions[status] || '';
};
