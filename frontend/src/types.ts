// =====================================================================
// types.ts - Type definitions สำหรับทั้งแอป
// =====================================================================

// ===== CONSTANTS (ใช้เป็นทั้ง type และ value) =====

// บทบาทผู้ใช้
export const UserRole = {
  ADMIN: 'ADMIN',                                                         // ผู้ดูแลระบบ
  USER: 'USER',                                                           // ผู้ใช้ทั่วไป
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];            // Type = 'ADMIN' | 'USER'

// สถานะการยืม (State Machine)
export const RentalStatus = {
  PENDING: 'PENDING',                                                     // รอพิจารณา
  APPROVED: 'APPROVED',                                                   // อนุมัติแล้ว
  CHECKED_OUT: 'CHECKED_OUT',                                             // รับอุปกรณ์ไปแล้ว
  RETURNED: 'RETURNED',                                                   // คืนแล้ว
  REJECTED: 'REJECTED',                                                   // ถูกปฏิเสธ
  CANCELLED: 'CANCELLED',                                                 // ยกเลิก
} as const;
export type RentalStatus = typeof RentalStatus[keyof typeof RentalStatus];

// สถานะชิ้นงาน
export const EquipmentItemStatus = {
  AVAILABLE: 'AVAILABLE',                                                 // พร้อมยืม
  UNAVAILABLE: 'UNAVAILABLE',                                             // ไม่พร้อม
  RENTED: 'RENTED',                                                       // ถูกยืมอยู่
} as const;
export type EquipmentItemStatus = typeof EquipmentItemStatus[keyof typeof EquipmentItemStatus];

// ===== INTERFACES =====

// ข้อมูลผู้ใช้
export interface User {
  id: string;
  studentId: string;                                                      // รหัสนักศึกษา
  name: string;                                                           // ชื่อผู้ใช้
  role: UserRole;                                                         // ADMIN หรือ USER
}

// ชิ้นงานแต่ละตัว (เช่น กล้อง #001, #002)
export interface EquipmentItem {
  id: string;
  equipmentId: string;                                                    // FK → Equipment
  itemCode: string;                                                       // รหัสชิ้นงาน "001", "002"
  status: EquipmentItemStatus;                                            // AVAILABLE, RENTED, UNAVAILABLE
  createdAt: string;
}

// ประเภทอุปกรณ์ (มีหลาย items)
export interface Equipment {
  id: string;
  name: string;                                                           // ชื่ออุปกรณ์
  category: string;                                                       // หมวดหมู่
  description?: string;                                                   // คำอธิบาย
  stockQty: number;                                                       // จำนวนพร้อมยืม
  imageUrl?: string;                                                      // URL รูปภาพ
  status: 'AVAILABLE' | 'MAINTENANCE' | 'UNAVAILABLE';                    // สถานะรวม
  items?: EquipmentItem[];                                                // รายการชิ้นงาน
}

// การยืม-คืน
export interface Rental {
  id: string;
  equipment: Equipment;                                                   // อุปกรณ์ที่ยืม
  equipmentItemId?: string;                                               // ชิ้นงานเฉพาะ (optional)
  equipmentItem?: EquipmentItem;
  startDate: string;                                                      // วันเริ่มยืม
  endDate: string;                                                        // วันคืน
  status: RentalStatus;                                                   // สถานะปัจจุบัน
  requestDetails?: string;                                                // เหตุผลขอยืม
  rejectReason?: string;                                                  // เหตุผลปฏิเสธ
  user?: User;                                                            // ผู้ยืม (สำหรับ admin)
  // หลักฐานการรับ-คืน
  checkoutImageUrl?: string;                                              // รูปตอนรับ
  checkoutNote?: string;
  returnImageUrl?: string;                                                // รูปตอนคืน
  returnNote?: string;
  cancelReason?: string;                                                  // เหตุผลยกเลิก
}

// Response จาก Login API
export interface AuthResponse {
  accessToken: string;                                                    // JWT token
  user: User;                                                             // ข้อมูลผู้ใช้
}

// บันทึกกิจกรรม
export interface AuditLog {
  id: string;
  userId: string;
  username: string;                                                       // ชื่อผู้ทำรายการ
  actionType: string;                                                     // RENTAL_CREATE, EQUIPMENT_UPDATE, etc.
  details?: string;                                                       // JSON รายละเอียด
  createdAt: string;
}

// ===== CART TYPES =====

// Item ในตะกร้ายืม
export interface CartItem {
  equipmentId: string;
  equipmentName: string;                                                  // ชื่ออุปกรณ์
  equipmentImage?: string;
  itemId: string;                                                         // ID ชิ้นงาน
  itemCode: string;                                                       // รหัสชิ้นงาน
  addedAt: number;                                                        // เวลาที่เพิ่ม (timestamp)
  expiresAt: number;                                                      // หมดอายุ (addedAt + 15 นาที)
}