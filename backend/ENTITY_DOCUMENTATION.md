# 📦 Entity Documentation - Gear Rental System

เอกสารนี้อธิบายการนิยาม **Entity** ทั้งหมดใน Backend อย่างละเอียด รวมถึงหลักการออกแบบและความสัมพันธ์ระหว่าง Entity

---

## 📋 สารบัญ

1. [ความรู้พื้นฐานเกี่ยวกับ Entity](#1-ความรู้พื้นฐานเกี่ยวกับ-entity)
2. [TypeORM Decorators ที่ใช้](#2-typeorm-decorators-ที่ใช้)
3. [User Entity](#3-user-entity)
4. [Equipment Entity](#4-equipment-entity)
5. [EquipmentItem Entity](#5-equipmentitem-entity)
6. [Rental Entity](#6-rental-entity)
7. [AuditLog Entity](#7-auditlog-entity)
8. [Enums ที่ใช้ในระบบ](#8-enums-ที่ใช้ในระบบ)
9. [Entity Relationship Diagram](#9-entity-relationship-diagram)
10. [สรุปหลักการออกแบบ](#10-สรุปหลักการออกแบบ)

---

## 1. ความรู้พื้นฐานเกี่ยวกับ Entity

### Entity คืออะไร?

**Entity** คือ class ที่ map กับตาราง (table) ในฐานข้อมูล โดยใช้ **TypeORM** ซึ่งเป็น Object-Relational Mapping (ORM) library

```
TypeScript Class (Entity) → TypeORM → PostgreSQL Table
```

### โครงสร้าง Entity พื้นฐาน

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('table_name')  // ระบุชื่อตาราง
export class EntityName {
    @PrimaryGeneratedColumn('uuid')  // Primary Key
    id: string;

    @Column()  // Column ปกติ
    fieldName: string;
}
```

---

## 2. TypeORM Decorators ที่ใช้

### 2.1 Decorators หลัก

| Decorator | คำอธิบาย | ตัวอย่าง |
|-----------|----------|----------|
| `@Entity()` | ประกาศว่า class นี้เป็น Entity | `@Entity('users')` |
| `@PrimaryGeneratedColumn()` | Primary Key ที่สร้างอัตโนมัติ | `@PrimaryGeneratedColumn('uuid')` |
| `@Column()` | คอลัมน์ปกติ | `@Column({ nullable: true })` |
| `@CreateDateColumn()` | วันที่สร้าง Record (auto) | `@CreateDateColumn()` |
| `@UpdateDateColumn()` | วันที่แก้ไขล่าสุด (auto) | `@UpdateDateColumn()` |

### 2.2 Relationship Decorators

| Decorator | คำอธิบาย | ความสัมพันธ์ |
|-----------|----------|-------------|
| `@OneToMany()` | หนึ่งต่อหลาย | 1 Equipment → N EquipmentItem |
| `@ManyToOne()` | หลายต่อหนึ่ง | N Rental → 1 User |
| `@JoinColumn()` | ระบุ Foreign Key Column | กำหนดชื่อคอลัมน์ FK |

### 2.3 Column Options

```typescript
@Column({
    type: 'varchar',      // ชนิดข้อมูล
    length: 255,          // ความยาว
    nullable: true,       // อนุญาตให้เป็น null
    unique: true,         // ค่าต้องไม่ซ้ำ
    default: 'value',     // ค่า default
})
```

---

## 3. User Entity

### 📍 ไฟล์: `src/users/entities/user.entity.ts`

### 3.1 โค้ดเต็ม

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  CreateDateColumn
} from 'typeorm';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  studentId: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 3.2 อธิบายแต่ละ Field

| Field | Type | Options | คำอธิบาย |
|-------|------|---------|----------|
| `id` | `uuid` | Primary Key | ID ผู้ใช้ (UUID) |
| `studentId` | `varchar` | unique, nullable | รหัสนักศึกษา (ใช้ Login) |
| `password` | `varchar` | required | รหัสผ่าน (Hashed ด้วย bcrypt) |
| `name` | `varchar` | nullable | ชื่อ-นามสกุล |
| `role` | `enum` | default: USER | บทบาท (ADMIN/USER) |
| `createdAt` | `timestamp` | auto | วันที่สร้าง account |
| `updatedAt` | `timestamp` | auto | วันที่แก้ไขล่าสุด |

### 3.3 หลักการออกแบบ

```
✅ ใช้ UUID แทน auto-increment → ปลอดภัยกว่า, ไม่ถูกเดา

✅ Password ถูก hash ก่อนเก็บ → ความปลอดภัย

✅ ใช้ studentId แทน email → เหมาะกับบริบทสถานศึกษา

✅ แยก Role เป็น enum → ควบคุมค่าที่เป็นไปได้
```

---

## 4. Equipment Entity

### 📍 ไฟล์: `src/equipments/entities/equipment.entity.ts`

### 4.1 โค้ดเต็ม

```typescript
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    OneToMany,
} from 'typeorm';

import { EquipmentStatus } from '../../common/enums';
import { EquipmentItem } from './equipment-item.entity';

@Entity('equipments')
export class Equipment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    category: string;

    @Column({
        type: 'enum',
        enum: EquipmentStatus,
        default: EquipmentStatus.AVAILABLE,
    })
    status: EquipmentStatus;

    @Column({ default: 1 })
    stockQty: number;

    @Column({ nullable: true })
    imageUrl: string;

    @OneToMany(() => EquipmentItem, (item) => item.equipment, { cascade: true, eager: true })
    items: EquipmentItem[];

    @CreateDateColumn()
    createdAt: Date;
}
```

### 4.2 อธิบายแต่ละ Field

| Field | Type | Options | คำอธิบาย |
|-------|------|---------|----------|
| `id` | `uuid` | Primary Key | ID อุปกรณ์ |
| `name` | `varchar` | required | ชื่ออุปกรณ์ |
| `category` | `varchar` | nullable | หมวดหมู่ |
| `status` | `enum` | default: AVAILABLE | สถานะอุปกรณ์ |
| `stockQty` | `int` | default: 1 | จำนวน stock |
| `imageUrl` | `varchar` | nullable | URL รูปภาพ |
| `items` | `EquipmentItem[]` | relation | รายการ Item ทั้งหมด |
| `createdAt` | `timestamp` | auto | วันที่สร้าง |

### 4.3 Relationship: OneToMany

```typescript
@OneToMany(() => EquipmentItem, (item) => item.equipment, { 
    cascade: true,   // บันทึก Items พร้อม Equipment
    eager: true      // โหลด Items อัตโนมัติ
})
items: EquipmentItem[];
```

**อธิบาย Options:**

| Option | ค่า | ความหมาย |
|--------|-----|----------|
| `cascade` | `true` | เมื่อ save Equipment จะ save Items ด้วย |
| `eager` | `true` | เมื่อ query Equipment จะโหลด Items มาด้วยเสมอ |

---

## 5. EquipmentItem Entity

### 📍 ไฟล์: `src/equipments/entities/equipment-item.entity.ts`

### 5.1 โค้ดเต็ม

```typescript
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { EquipmentItemStatus } from '../../common/enums';
import { Equipment } from './equipment.entity';

@Entity('equipment_items')
export class EquipmentItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    equipmentId: string;

    @ManyToOne(() => Equipment, (equipment) => equipment.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'equipmentId' })
    equipment: Equipment;

    @Column()
    itemCode: string;

    @Column({
        type: 'enum',
        enum: EquipmentItemStatus,
        default: EquipmentItemStatus.AVAILABLE,
    })
    status: EquipmentItemStatus;

    @CreateDateColumn()
    createdAt: Date;
}
```

### 5.2 อธิบายแต่ละ Field

| Field | Type | Options | คำอธิบาย |
|-------|------|---------|----------|
| `id` | `uuid` | Primary Key | ID ของ Item |
| `equipmentId` | `uuid` | Foreign Key | อ้างอิง Equipment |
| `equipment` | `Equipment` | relation | Relation กับ Equipment |
| `itemCode` | `varchar` | required | รหัสชิ้น เช่น "001" |
| `status` | `enum` | default: AVAILABLE | สถานะชิ้นงาน |
| `createdAt` | `timestamp` | auto | วันที่สร้าง |

### 5.3 Relationship: ManyToOne

```typescript
@ManyToOne(() => Equipment, (equipment) => equipment.items, { 
    onDelete: 'CASCADE'  // เมื่อลบ Equipment จะลบ Items ด้วย
})
@JoinColumn({ name: 'equipmentId' })  // ระบุชื่อ FK column
equipment: Equipment;
```

### 5.4 แผนภาพความสัมพันธ์

```
┌─────────────────────────────────────────┐
│            Equipment                     │
│  id: "abc-123"                          │
│  name: "Camera Canon EOS"               │
│  stockQty: 3                            │
└─────────────────────────────────────────┘
                    │
                    │ OneToMany
                    ▼
┌─────────────────────────────────────────┐
│          EquipmentItem (3 records)       │
├─────────────────────────────────────────┤
│  id: "item-1", itemCode: "001"          │
│  id: "item-2", itemCode: "002"          │
│  id: "item-3", itemCode: "003"          │
└─────────────────────────────────────────┘
```

---

## 6. Rental Entity

### 📍 ไฟล์: `src/rentals/entities/rental.entity.ts`

### 6.1 โค้ดเต็ม

```typescript
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { RentalStatus } from '../../common/enums';
import { User } from '../../users/entities/user.entity';
import { Equipment } from '../../equipments/entities/equipment.entity';
import { EquipmentItem } from '../../equipments/entities/equipment-item.entity';

@Entity('rentals')
export class Rental {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // === User Relation ===
    @Column()
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    // === Equipment Relation ===
    @Column()
    equipmentId: string;

    @ManyToOne(() => Equipment, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'equipmentId' })
    equipment: Equipment;

    // === EquipmentItem Relation (Optional) ===
    @Column({ nullable: true })
    equipmentItemId: string;

    @ManyToOne(() => EquipmentItem, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'equipmentItemId' })
    equipmentItem: EquipmentItem;

    // === Rental Period ===
    @Column({ type: 'timestamp' })
    startDate: Date;

    @Column({ type: 'timestamp' })
    endDate: Date;

    // === Status & Details ===
    @Column({
        type: 'enum',
        enum: RentalStatus,
        default: RentalStatus.PENDING,
    })
    status: RentalStatus;

    @Column({ type: 'text', nullable: true })
    requestDetails: string;

    @Column({ nullable: true })
    attachmentUrl: string;

    @Column({ type: 'text', nullable: true })
    rejectReason: string;

    // === Evidence Fields ===
    @Column({ nullable: true })
    checkoutImageUrl: string;

    @Column({ type: 'text', nullable: true })
    checkoutNote: string;

    @Column({ nullable: true })
    returnImageUrl: string;

    @Column({ type: 'text', nullable: true })
    returnNote: string;

    @Column({ type: 'text', nullable: true })
    cancelReason: string;

    @CreateDateColumn()
    createdAt: Date;
}
```

### 6.2 อธิบายแต่ละ Field

#### Core Fields

| Field | Type | Options | คำอธิบาย |
|-------|------|---------|----------|
| `id` | `uuid` | PK | ID การยืม |
| `userId` | `uuid` | FK | ผู้ยืม |
| `equipmentId` | `uuid` | FK, CASCADE | อุปกรณ์ที่ยืม |
| `equipmentItemId` | `uuid` | FK, SET NULL, nullable | ชิ้นงานที่ยืม (ถ้าเจาะจง) |
| `startDate` | `timestamp` | required | วันเริ่มยืม |
| `endDate` | `timestamp` | required | วันสิ้นสุด |
| `status` | `enum` | default: PENDING | สถานะการยืม |

#### Detail Fields

| Field | Type | Options | คำอธิบาย |
|-------|------|---------|----------|
| `requestDetails` | `text` | nullable | รายละเอียดคำขอ |
| `attachmentUrl` | `varchar` | nullable | ไฟล์แนบ |
| `rejectReason` | `text` | nullable | เหตุผลที่ถูกปฏิเสธ |

#### Evidence Fields

| Field | คำอธิบาย |
|-------|----------|
| `checkoutImageUrl` | รูปถ่ายตอนรับอุปกรณ์ |
| `checkoutNote` | หมายเหตุตอนรับ |
| `returnImageUrl` | รูปถ่ายตอนคืน |
| `returnNote` | หมายเหตุตอนคืน |
| `cancelReason` | เหตุผลยกเลิก |

### 6.3 onDelete Strategies

```typescript
// เมื่อลบ Equipment → ลบ Rental ทิ้ง
@ManyToOne(() => Equipment, { onDelete: 'CASCADE' })

// เมื่อลบ EquipmentItem → เก็บ Rental ไว้, set FK = null
@ManyToOne(() => EquipmentItem, { nullable: true, onDelete: 'SET NULL' })
```

| Strategy | ความหมาย | Use Case |
|----------|----------|----------|
| `CASCADE` | ลบ parent → ลบ child | ลบ Equipment → ลบ Rental |
| `SET NULL` | ลบ parent → FK เป็น null | ลบ Item แต่เก็บประวัติ |
| `RESTRICT` | ห้ามลบถ้ายังมี child | ไม่ได้ใช้ในระบบนี้ |

---

## 7. AuditLog Entity

### 📍 ไฟล์: `src/audit-logs/entities/audit-log.entity.ts`

### 7.1 โค้ดเต็ม

```typescript
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Rental } from '../../rentals/entities/rental.entity';

@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    rentalId: string;

    @ManyToOne(() => Rental, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'rentalId' })
    rental: Rental;

    @Column()
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    username: string;

    @Column()
    actionType: string;

    @Column({ type: 'text', nullable: true })
    details: string;

    @CreateDateColumn()
    createdAt: Date;
}
```

### 7.2 อธิบายแต่ละ Field

| Field | Type | Options | คำอธิบาย |
|-------|------|---------|----------|
| `id` | `uuid` | PK | ID ของ Log |
| `rentalId` | `uuid` | FK, SET NULL | การยืมที่เกี่ยวข้อง (ถ้ามี) |
| `userId` | `uuid` | FK | ผู้ทำรายการ |
| `username` | `varchar` | required | ชื่อผู้ทำ (Denormalized) |
| `actionType` | `varchar` | required | ประเภทการกระทำ |
| `details` | `text` | nullable | รายละเอียด (JSON) |
| `createdAt` | `timestamp` | auto | วันเวลาที่ทำ |

### 7.3 Denormalization

ทำไมต้องเก็บ `username` ซ้ำ?

```typescript
@Column()
username: string;  // เก็บซ้ำจาก User.name
```

**เหตุผล:**
1. **Historical Accuracy**: ถ้า User เปลี่ยนชื่อ Log ยังคงแสดงชื่อเดิม
2. **Performance**: ไม่ต้อง JOIN กับ users table ทุกครั้ง
3. **Data Integrity**: ถ้า User ถูกลบ ยังมีข้อมูลว่าใครทำ

---

## 8. Enums ที่ใช้ในระบบ

### 📍 ไฟล์: `src/common/enums/index.ts`

```typescript
// บทบาทของผู้ใช้
export enum UserRole {
    ADMIN = 'ADMIN',    // ผู้ดูแลระบบ
    USER = 'USER',      // ผู้ใช้งานทั่วไป
}

// สถานะของการยืม
export enum RentalStatus {
    PENDING = 'PENDING',           // รอการอนุมัติ
    APPROVED = 'APPROVED',         // อนุมัติแล้ว
    CHECKED_OUT = 'CHECKED_OUT',   // รับอุปกรณ์แล้ว
    RETURNED = 'RETURNED',         // คืนแล้ว
    REJECTED = 'REJECTED',         // ถูกปฏิเสธ
    CANCELLED = 'CANCELLED',       // ยกเลิก
}

// สถานะของอุปกรณ์ (ประเภท)
export enum EquipmentStatus {
    AVAILABLE = 'AVAILABLE',       // พร้อมให้ยืม
    MAINTENANCE = 'MAINTENANCE',   // กำลังซ่อมบำรุง
    UNAVAILABLE = 'UNAVAILABLE',   // ไม่พร้อม (หมด stock)
}

// สถานะของอุปกรณ์ (รายชิ้น)
export enum EquipmentItemStatus {
    AVAILABLE = 'AVAILABLE',       // ว่าง
    UNAVAILABLE = 'UNAVAILABLE',   // ไม่พร้อม
    RENTED = 'RENTED',             // ถูกยืมอยู่
}
```

### ทำไมต้องใช้ Enum?

| ข้อดี | คำอธิบาย |
|------|----------|
| ✅ Type Safety | TypeScript ตรวจสอบค่าได้ |
| ✅ Database Constraint | PostgreSQL บังคับค่าที่ถูกต้อง |
| ✅ Auto-complete | IDE แนะนำค่าที่เป็นไปได้ |
| ✅ Readability | อ่านเข้าใจง่ายกว่า magic strings |

---

## 9. Entity Relationship Diagram

### แผนภาพความสัมพันธ์

```
┌─────────────────┐          ┌─────────────────────┐
│      users      │          │     equipments      │
├─────────────────┤          ├─────────────────────┤
│ id (PK, UUID)   │          │ id (PK, UUID)       │
│ studentId       │          │ name                │
│ password        │          │ category            │
│ name            │          │ status (enum)       │
│ role (enum)     │          │ stockQty            │
│ createdAt       │          │ imageUrl            │
│ updatedAt       │          │ createdAt           │
└────────┬────────┘          └──────────┬──────────┘
         │                              │
         │ 1:N                          │ 1:N
         │                              │
         │         ┌──────────┐         │
         │         │          │         │
         ▼         ▼          ▼         ▼
┌───────────────────────────────────────────────┐
│                   rentals                      │
├───────────────────────────────────────────────┤
│ id (PK, UUID)                                 │
│ userId (FK) ──────────────────────► users     │
│ equipmentId (FK) ─────────────────► equipments│
│ equipmentItemId (FK, nullable) ──► equipment_items
│ startDate                                     │
│ endDate                                       │
│ status (enum)                                 │
│ requestDetails, attachmentUrl, rejectReason   │
│ checkoutImageUrl, checkoutNote                │
│ returnImageUrl, returnNote, cancelReason      │
│ createdAt                                     │
└───────────────────────────────────────────────┘
         │
         │ 1:N (SET NULL)
         ▼
┌───────────────────────────────────────────────┐
│                  audit_logs                    │
├───────────────────────────────────────────────┤
│ id (PK, UUID)                                 │
│ rentalId (FK, nullable) ──────────► rentals   │
│ userId (FK) ──────────────────────► users     │
│ username (denormalized)                       │
│ actionType                                    │
│ details (JSON)                                │
│ createdAt                                     │
└───────────────────────────────────────────────┘


┌─────────────────────┐
│  equipment_items    │
├─────────────────────┤
│ id (PK, UUID)       │
│ equipmentId (FK) ──────► equipments (CASCADE)
│ itemCode            │
│ status (enum)       │
│ createdAt           │
└─────────────────────┘
```

---

## 10. สรุปหลักการออกแบบ

### 10.1 Naming Conventions

| ประเภท | Convention | ตัวอย่าง |
|--------|------------|----------|
| Table Name | snake_case, พหูพจน์ | `users`, `equipment_items` |
| Column Name | camelCase | `userId`, `createdAt` |
| Entity Class | PascalCase, เอกพจน์ | `User`, `EquipmentItem` |
| Enum | PascalCase | `RentalStatus` |

### 10.2 Primary Key Strategy

```typescript
@PrimaryGeneratedColumn('uuid')  // ใช้ UUID ทุก Entity
id: string;
```

**เหตุผล:**
- ปลอดภัยกว่า auto-increment (ไม่ถูกเดา)
- รองรับ distributed systems
- ไม่ต้อง query หา next ID

### 10.3 Foreign Key Strategies

| Strategy | เมื่อไหร่ใช้ | ตัวอย่างในระบบ |
|----------|-------------|----------------|
| `CASCADE` | Child ไม่มีความหมายถ้าไม่มี Parent | Equipment → EquipmentItem |
| `SET NULL` | ต้องเก็บ Child แม้ลบ Parent | Rental → EquipmentItem |
| (default) | ห้ามลบ Parent ถ้ามี Child | User → Rental |

### 10.4 Nullable Fields

- `nullable: true` สำหรับ optional fields
- Required fields ไม่ต้องระบุ (default: false)

### 10.5 Date Columns

```typescript
@CreateDateColumn()   // บันทึกอัตโนมัติตอนสร้าง
createdAt: Date;

@UpdateDateColumn()   // อัพเดทอัตโนมัติทุกครั้งที่ save
updatedAt: Date;
```

---

*เอกสารนี้สร้างเมื่อ: January 2026*
