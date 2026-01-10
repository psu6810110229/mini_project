/**
 * EmptyState Component
 * 
 * Displays a friendly message when there's no data to show.
 * Used throughout the app for empty lists, search results, etc.
 * 
 * HOW IT WORKS:
 * - Takes an icon component and a message
 * - Renders a centered card with the icon and message
 * - Provides visual feedback that the empty state is intentional
 * 
 * USAGE:
 *   import { Package } from 'lucide-react';
 *   <EmptyState icon={Package} message="No equipment found" />
 * 
 * WHY THIS EXISTS:
 * - Better UX than showing nothing
 * - Consistent empty state design across the app
 * - Tells user it's not an error, just no data
 */
import type { LucideIcon } from 'lucide-react';  // Type-only import (doesn't add to bundle)

// Props interface
interface EmptyStateProps {
    icon: LucideIcon;   // A Lucide icon component (passed as a variable, not JSX)
    message: string;    // Text to display
}

export default function EmptyState({ icon: Icon, message }: EmptyStateProps) {
    // Note: "icon: Icon" renames the prop so we can use it as <Icon /> component
    // In React, component names must start with uppercase

    return (
        // col-span-full = span all columns in a grid (for use in grid layouts)
        <div className="col-span-full backdrop-blur-2xl bg-slate-900/60 rounded-2xl border border-white/20 p-12 text-center">
            {/* Icon - rendered as a component */}
            {/* w-16 h-16 = 64px × 64px */}
            {/* mx-auto = center horizontally (margin-left and margin-right auto) */}
            <Icon className="w-16 h-16 mx-auto mb-4 text-white/30" />

            {/* Message text */}
            <p className="text-white/60 text-lg">{message}</p>
        </div>
    );
}
