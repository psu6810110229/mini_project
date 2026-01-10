/**
 * SearchBar Component
 * 
 * A reusable search input with an icon and clear button.
 * Provides consistent search experience across all pages.
 * 
 * HOW IT WORKS:
 * - User types in the input field
 * - onChange callback is called with the new value
 * - Parent component receives the value and filters data
 * - Clear button (X) appears when there's text
 * 
 * USAGE:
 *   const [search, setSearch] = useState('');
 *   <SearchBar value={search} onChange={setSearch} placeholder="Search..." />
 * 
 * DESIGN PATTERN: Controlled Component
 * - The input's value is controlled by the parent component's state
 * - This allows the parent to know the current value at all times
 */
import { Search, X } from 'lucide-react';

// Props interface - defines what data this component needs
interface SearchBarProps {
    value: string;               // Current search text (from parent state)
    onChange: (val: string) => void;  // Function to update parent state
    placeholder?: string;        // Placeholder text (optional)
}

export default function SearchBar({ value, onChange, placeholder = 'Search...' }: SearchBarProps) {
    return (
        // relative - allows positioning the icons absolutely inside
        <div className="relative">
            {/* Search icon - positioned on the left side */}
            {/* absolute = taken out of normal flow, positioned relative to parent */}
            {/* left-4 = 16px from left edge */}
            {/* top-1/2 -translate-y-1/2 = vertically centered (CSS trick) */}
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />

            {/* Input field */}
            {/* pl-12 = padding-left 48px (makes room for search icon) */}
            {/* focus:ring = adds blue glow when focused (accessibility) */}
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}  // Call parent's onChange with new value
                className="w-full pl-12 pr-10 py-3 bg-slate-800/50 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />

            {/* Clear button - only shown when there's text */}
            {/* value && (...) = short-circuit: only render if value is truthy */}
            {value && (
                <button
                    onClick={() => onChange('')}  // Clear the search
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                    aria-label="Clear search"  // Accessibility: screen readers read this
                >
                    <X className="w-5 h-5" />
                </button>
            )}
        </div>
    );
}
