/**
 * ConfirmModal Component
 * 
 * A reusable confirmation dialog that appears before destructive actions.
 * Used to prevent accidental deletions or important actions.
 * 
 * WHY THIS EXISTS:
 * - UX best practice: confirm before destructive actions
 * - Prevents accidental clicks from causing problems
 * - Consistent confirmation experience across the app
 * 
 * PROPS EXPLANATION:
 * - isOpen: Show or hide the modal (boolean)
 * - title: Dialog title text
 * - message: Explanation text
 * - variant: 'danger' | 'warning' | 'success' - changes button color
 * - onConfirm: Function called when user clicks confirm
 * - onCancel: Function called when user clicks cancel or backdrop
 * - loading: Shows spinner on confirm button when processing
 * - children: Optional extra content to render inside modal
 * 
 * USAGE EXAMPLE:
 *   <ConfirmModal
 *     isOpen={showModal}
 *     title="Delete Equipment?"
 *     message="This cannot be undone."
 *     variant="danger"
 *     onConfirm={handleDelete}
 *     onCancel={() => setShowModal(false)}
 *   />
 */
import { AlertTriangle, X } from 'lucide-react';

// Props interface - TypeScript way to define component inputs
interface ConfirmModalProps {
    isOpen: boolean;          // Controls visibility
    title: string;            // Modal title
    message: string;          // Description text
    confirmLabel?: string;    // Button text (default: 'Confirm')
    cancelLabel?: string;     // Cancel button text (default: 'Cancel')
    variant?: 'danger' | 'warning' | 'success';  // Button color theme
    onConfirm: () => void;    // Called when confirmed
    onCancel: () => void;     // Called when cancelled
    loading?: boolean;        // Shows loading state
    children?: React.ReactNode;  // Optional extra content
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    confirmLabel = 'ยืนยัน',
    cancelLabel = 'ยกเลิก',
    variant = 'warning',
    onConfirm,
    onCancel,
    loading = false,
    children
}: ConfirmModalProps) {
    // Early return pattern - if not open, render nothing
    // This is more efficient than wrapping everything in a conditional
    if (!isOpen) return null;

    // Map variant to Tailwind gradient classes
    // Using an object is cleaner than if/else chains
    const variantStyles = {
        danger: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
        warning: 'from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700',
        success: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    };

    // Fixed positioning - covers entire screen
    // z-[9999] = highest z-index so it appears above everything
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop - semi-transparent background that closes modal on click */}
            {/* backdrop-blur-md on the backdrop itself for full page blur */}
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={onCancel} />

            {/* Modal card - relative so it appears above the backdrop */}
            <div className="relative backdrop-blur-2xl bg-gradient-to-b from-slate-800/95 to-slate-900/95 rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in border border-white/20">
                <div className="p-6">
                    {/* Header with icon and close button */}
                    <div className="flex items-center gap-3 mb-4">
                        {/* Warning icon */}
                        <div className="p-3 bg-amber-500/20 rounded-2xl">
                            <AlertTriangle className="h-7 w-7 text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">{title}</h3>
                            <p className="text-sm text-white/60">{message}</p>
                        </div>
                        {/* Close button - X icon */}
                        <button onClick={onCancel} className="ml-auto p-2 hover:bg-white/10 rounded-xl transition-all">
                            <X className="w-5 h-5 text-white/50" />
                        </button>
                    </div>

                    {/* Optional extra content passed as children */}
                    {children}

                    {/* Action buttons */}
                    <div className="flex gap-3 mt-6">
                        {/* Cancel button - secondary style */}
                        <button
                            onClick={onCancel}
                            disabled={loading}
                            className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-white/10 hover:bg-white/20 transition-all border border-white/20 disabled:opacity-50"
                        >
                            {cancelLabel}
                        </button>
                        {/* Confirm button - primary style with variant color */}
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className={`flex-1 px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r ${variantStyles[variant]} transition-all shadow-lg disabled:opacity-50`}
                        >
                            {loading ? 'Processing...' : confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
