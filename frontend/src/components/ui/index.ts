/**
 * UI Components Barrel Export
 * 
 * This file allows you to import multiple components from one place:
 * 
 * BEFORE: import LoadingSpinner from '../components/ui/LoadingSpinner';
 *         import SearchBar from '../components/ui/SearchBar';
 * 
 * AFTER:  import { LoadingSpinner, SearchBar } from '../components/ui';
 * 
 * This pattern is called "barrel export" - named after a barrel 
 * that contains many items you can pick from.
 */

// Re-export all UI components from this single file
export { default as LoadingSpinner } from './LoadingSpinner';
export { default as SearchBar } from './SearchBar';
export { default as EmptyState } from './EmptyState';
export { default as ConfirmModal } from './ConfirmModal';
