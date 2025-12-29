// src/types.ts

// 1. Constants
export const UserRole = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export const RentalStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  CHECKED_OUT: 'CHECKED_OUT',
  RETURNED: 'RETURNED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;
export type RentalStatus = typeof RentalStatus[keyof typeof RentalStatus];

// 2. Interfaces
export interface User {
  id: string;
  studentId: string;
  name: string;
  role: UserRole;
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  description?: string;
  stockQty: number;
  imageUrl?: string;
  status: 'AVAILABLE' | 'MAINTENANCE' | 'UNAVAILABLE';
}

export interface Rental {
  id: string;
  equipment: Equipment;
  startDate: string;
  endDate: string;
  status: RentalStatus;
  requestDetails?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  actionType: string;
  details?: string;
  createdAt: string;
}