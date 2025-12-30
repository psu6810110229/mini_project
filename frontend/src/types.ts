// Constants matching your "Single Source of Truth"
export const UserRole = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;

export const RentalStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  CHECKED_OUT: 'CHECKED_OUT',
  RETURNED: 'RETURNED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];
export type RentalStatus = typeof RentalStatus[keyof typeof RentalStatus];

// Interfaces
export interface User {
  id: string;
  studentId: string; // Used for login
  name: string;
  role: typeof UserRole[keyof typeof UserRole];
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  description?: string;
  stockQty: number;
  imageUrl?: string;
  status: 'AVAILABLE' | 'MAINTENANCE';
}

export interface Rental {
  id: string;
  equipment: Equipment; // Nested object from relation
  startDate: string;
  endDate: string;
  status: RentalStatus;
  requestDetails?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}