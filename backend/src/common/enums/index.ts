/**
 * Shared Enums for the Gear Rental System
 */

// User roles in the system
export enum UserRole {
    ADMIN = 'admin',
    STAFF = 'staff',
    CUSTOMER = 'customer',
}

// Status of a rental transaction
export enum RentalStatus {
    PENDING = 'pending',
    ACTIVE = 'active',
    RETURNED = 'returned',
    OVERDUE = 'overdue',
    CANCELLED = 'cancelled',
}

// Status of equipment availability
export enum EquipmentStatus {
    AVAILABLE = 'available',
    RENTED = 'rented',
    MAINTENANCE = 'maintenance',
    RETIRED = 'retired',
}
