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

export const EquipmentItemStatus = {
  AVAILABLE: 'AVAILABLE',
  UNAVAILABLE: 'UNAVAILABLE',
  RENTED: 'RENTED',
} as const;
export type EquipmentItemStatus = typeof EquipmentItemStatus[keyof typeof EquipmentItemStatus];

// 2. Interfaces
export interface User {
  id: string;
  studentId: string;
  name: string;
  role: UserRole;
}

export interface EquipmentItem {
  id: string;
  equipmentId: string;
  itemCode: string;
  status: EquipmentItemStatus;
  createdAt: string;
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  description?: string;
  stockQty: number;
  imageUrl?: string;
  status: 'AVAILABLE' | 'MAINTENANCE' | 'UNAVAILABLE';
  items?: EquipmentItem[];
}

export interface Rental {
  id: string;
  equipment: Equipment;
  equipmentItemId?: string;
  equipmentItem?: EquipmentItem;
  startDate: string;
  endDate: string;
  status: RentalStatus;
  requestDetails?: string;
  rejectReason?: string;
  user?: User;
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

// Cart types
export interface CartItem {
  equipmentId: string;
  equipmentName: string;
  equipmentImage?: string;
  itemId: string;
  itemCode: string;
  addedAt: number; // timestamp
  expiresAt: number; // timestamp (addedAt + 15 minutes)
}