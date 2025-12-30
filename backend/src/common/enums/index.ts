/**
 * Shared Enums for the Gear Rental System
 */

// User roles in the system
export enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER',
}

// Status of a rental transaction
export enum RentalStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    CHECKED_OUT = 'CHECKED_OUT',
    RETURNED = 'RETURNED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED',
}

// Status of equipment availability
export enum EquipmentStatus {
    AVAILABLE = 'AVAILABLE',
    MAINTENANCE = 'MAINTENANCE',
    UNAVAILABLE = 'UNAVAILABLE',
}

// Status of individual equipment item
export enum EquipmentItemStatus {
    AVAILABLE = 'AVAILABLE',
    UNAVAILABLE = 'UNAVAILABLE',
    RENTED = 'RENTED',
}
