/**
 * LoadingSpinner Component
 * 
 * A reusable loading indicator with customizable message and size.
 * Used when data is being fetched from the backend API.
 * 
 * HOW IT WORKS:
 * - Displays a spinning circle animation (CSS animation)
 * - Shows a message below the spinner
 * - Centered on the screen using flexbox
 * 
 * USAGE:
 *   <LoadingSpinner message="Loading equipment..." />
 *   <LoadingSpinner message="Please wait..." size="lg" />
 * 
 * PROPS:
 * - message: Text shown below the spinner (default: "Loading...")
 * - size: Size of spinner - 'sm' | 'md' | 'lg' (default: 'md')
 */

// Props interface defines what data this component accepts
interface LoadingSpinnerProps {
    message?: string;  // Optional - has default value
    size?: 'sm' | 'md' | 'lg';  // Optional - only these 3 values allowed
}

// Main component - takes props and returns JSX
export default function LoadingSpinner({ message = 'Loading...', size = 'md' }: LoadingSpinnerProps) {
    // Map size prop to Tailwind CSS classes
    // This pattern is called "object lookup" - faster than if/else
    const sizeClasses = {
        sm: 'h-4 w-4',   // Small: 16px
        md: 'h-6 w-6',   // Medium: 24px (default)
        lg: 'h-8 w-8',   // Large: 32px
    };

    return (
        // min-h-[80vh] = minimum height 80% of viewport
        // flex items-center justify-center = center content both ways
        <div className="min-h-[80vh] flex items-center justify-center">
            {/* Glass effect container - backdrop-blur creates frosted glass look */}
            <div className="backdrop-blur-2xl bg-slate-900/60 rounded-2xl p-8 border border-white/20 shadow-xl">
                <div className="flex items-center gap-3">
                    {/* SVG Spinner - uses CSS animation 'animate-spin' */}
                    <svg className={`animate-spin ${sizeClasses[size]} text-white`} viewBox="0 0 24 24">
                        {/* Background circle (faded) */}
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        {/* Spinning arc (bright) - this creates the loading effect */}
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {/* Loading message text */}
                    <span className="text-white font-medium">{message}</span>
                </div>
            </div>
        </div>
    );
}
