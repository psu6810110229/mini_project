# 🎬 University Club Gear Rental System
## Technical Deep-Dive Report สำหรับ 5-Minute Pitching Demo

---

## 🎯 Overview โปรเจกต์คืออะไร

**University Club Gear** คือระบบยืม-คืนอุปกรณ์ถ่ายภาพสำหรับชมรมถ่ายภาพมหาวิทยาลัย

**Pain Point ที่แก้:**
- ก่อนหน้า: ใช้ Excel/กระดาษ → ข้อมูลกระจาย ติดตามยาก เกิดปัญหาจองซ้อน
- หลังจาก: ระบบออนไลน์ → จองได้ทุกที่ ตรวจสอบสถานะ real-time ป้องกันจองซ้อนอัตโนมัติ

---

## 🏗️ Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React + Vite)                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │   Login     │ │ Equipment   │ │  My Rentals │ │   Admin     │       │
│  │  Register   │ │  List/Detail│ │   (User)    │ │  Dashboard  │       │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │
│                            │                                           │
│                     axios (HTTP Client)                                │
│                     (Request + JWT Token)                              │
└────────────────────────────│───────────────────────────────────────────┘
                             │ REST API (JSON)
┌────────────────────────────│───────────────────────────────────────────┐
│                           BACKEND (NestJS)                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │    Auth     │ │   Users     │ │  Equipments │ │   Rentals   │       │
│  │   Module    │ │   Module    │ │   Module    │ │   Module    │       │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │
│                            │                                           │
│                      TypeORM (ORM)                                     │
│                      (SQL Queries)                                     │
└────────────────────────────│───────────────────────────────────────────┘
                             │ TCP/IP
┌────────────────────────────│───────────────────────────────────────────┐
│                       DATABASE (PostgreSQL)                            │
│  ┌─────────┐ ┌───────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │  users  │ │  equipments   │ │ equipment_items │ │    rentals      │ │
│  └─────────┘ └───────────────┘ └─────────────────┘ └─────────────────┘ │
│                  (Persistent Data Storage)                             │
└────────────────────────────────────────────────────────────────────────┘
```

**คำอธิบายสถาปัตยกรรม (Architecture Description):**

1. **Frontend Layer (ส่วนติดต่อผู้ใช้)**
    - **Technology:** React + Vite
    - **Role:** ทำหน้าที่แสดงผล UI และรับ Input จากผู้ใช้ เมื่อ User ทำรายการ (เช่น จองของ) จะส่ง HTTP Request ไปยัง Backend
    - **Why React?:**
        - **Component-Based:**
            - *Rationale:* ช่วยให้พัฒนาเว็บแอปขนาดใหญ่ได้ง่ายโดยการแบ่งหน้าจอที่ซับซ้อนออกเป็นชิ้นส่วนเล็กๆ (Components) ที่เป็นอิสระต่อกันและนำกลับมาใช้ใหม่ได้ ลดความซ้ำซ้อนของโค้ด
            - *Reference:* `RentalCard.tsx` - ไฟล์นี้สร้าง UI การ์ดแสดงข้อมูลการยืมเพียงครั้งเดียว แต่ถูกนำไปเรียกใช้ ("Render") ซ้ำๆ หลายครั้งในหน้า `AdminRentals.tsx` ผ่านคำสั่ง map: `rentals.map(rental => <RentalCard key={rental.id} rental={rental} />)` ทำให้แสดงรายการเช่าได้เป็นร้อยรายการโดยไม่ต้องเขียนโค้ดซ้ำ
        - **Virtual DOM (Responsiveness):**
            - *Rationale:* ช่วยให้การตอบสนองของเว็บรวดเร็วและลื่นไหล เพราะ React จะคำนวณส่วนที่เปลี่ยนแปลงในหน่วยความจำก่อน แล้วค่อยอัปเดตหน้าจอจริงเฉพาะจุดที่เปลี่ยนไปจริงๆ ไม่ใช่โหลดใหม่ทั้งหน้า
            - *Reference:* `Navbar.tsx` - ใช้ Class ของ Tailwind CSS เช่น `className="hidden md:flex"` ซึ่ง React จะช่วยจัดการการแสดงผล Element นี้ตามขนาดหน้าจอของผู้ใช้ (Mobile/Desktop) ได้อย่างมีประสิทธิภาพและทันที
        - **State Management (Context API):**
            - *Rationale:* เพื่อแก้ไขปัญหา "Prop Drilling" (การส่งข้อมูลผ่าน Component หลายชั้น) โดยการสร้าง "Store" กลางที่ทุก Component สามารถดึงข้อมูลไปใช้ได้ทันที เหมาะสำหรับข้อมูลที่ต้องใช้ร่วมกันทั้งแอป เช่น ตะกร้าสินค้า หรือ ข้อมูล User
            - *Reference:* `CartContext.tsx`
                - **What it is:** ไฟล์นี้คือ "Context Provider" ที่ทำหน้าที่เป็นแหล่งเก็บข้อมูลกลางของระบบตะกร้าสินค้า
                - **How it works:** ใช้ `createContext()` สร้างถังเก็บข้อมูล และ `useState()` เพื่อเก็บ list ของสินค้า (`cartItems`) จากนั้นใช้ `<CartContext.Provider value={{...}}>` ห่อหุ้ม App ไว้ เพื่อให้ทุก Component เข้าถึงได้ผ่านการเรียก `useCart()` นี่คือเหตุผลที่ตัวเลขจำนวนสินค้าใน Navbar อัปเดตทันทีเมื่อเรากดปุ่ม "Add to Cart" ในหน้า Home

2. **Backend Layer (ส่วนประมวลผลหลัก)**
    - **Technology:** NestJS (Node.js framework)
    - **Role:** เป็นหัวใจหลักในการทำงาน รับ Request จาก Frontend, ตรวจสอบสิทธิ์ (Auth), และประมวลผล Business Logic (เช่น คำนวณวันว่าง, ตัด Stock)
    - **Why NestJS?:**
        - **Modular Structure:**
            - *Rationale:* บังคับให้โครงสร้างโปรเจกต์มีความชัดเจน โดยแบ่งโค้ดเป็นส่วนๆ ตามหน้าที่ (Module) ทำให้ง่ายต่อการ Maintenance และทีมงานหลายคนสามารถทำงานพร้อมกันได้โดยไม่แก้โค้ดทับกัน
            - *Reference:* `rentals.module.ts` - ใช้ decorator `@Module({ imports: [...], controllers: [...], providers: [...] })` เพื่อมัดรวม Controller (รับ Request) และ Service (ทำงาน) ที่เกี่ยวกับ "การยืม" ไว้ในที่เดียว แยกขาดจากส่วน "User" หรือ "Auth" อย่างชัดเจน
        - **Configuration Management (.env):**
            - *Rationale:* จัดการค่าความลับ (Secrets) เช่น Database Password หรือ JWT Secret แยกจากโค้ดเพื่อความปลอดภัยตามหลัก 12-Factor App
            - *Reference:* `ConfigService` - ใช้ `@nestjs/config` โหลดค่าจากไฟล์ `.env` เข้ามาในแอปพลิเคชัน
        - **Built-in Features (Guards & Interceptors):**
            - *Rationale:* ลดการเขียนโค้ดซ้ำๆ (Boilerplate) สำหรับงานพื้นฐาน เช่น การเช็ค Login หรือการแปลงข้อมูล โดยมีเครื่องมือมาตรฐานให้เรียกใช้ได้เลย
            - *Reference:* `rentals.controller.ts` - บรรทัด `@UseGuards(JwtAuthGuard)` เหนือ method `create()` คือการสั่งว่า "ห้ามทำงานฟังก์ชันนี้นะ ถ้ายังไม่ได้ Login" โดยที่เราไม่ต้องเขียน logic เช็ค token เองในทุกๆ ฟังก์ชัน

3. **Database Layer (ส่วนจัดเก็บข้อมูล)**
    - **Technology:** PostgreSQL (รันบน Docker)
    - **Role:** เก็บข้อมูลถาวรทั้งหมดของระบบ เช่น ข้อมูลสมาชิก, รายการอุปกรณ์, และประวัติการยืม-คืน
    - **Why PostgreSQL?:**
        - **Relational Integrity (One-to-Many & Many-to-Many):**
            - *Rationale:* ระบบรองรับความสัมพันธ์ที่ซับซ้อนตามโจทย์
                - **One-to-Many:** User 1 คน มีได้หลาย Rental
                - **Many-to-Many (Resolved):** User และ Equipment มีความสัมพันธ์แบบ Many-to-Many (คนเดียวเช่าหลายของ, ของชิ้นเดียวถูกเช่าโดยหลายคน) โดยใช้ตาราง `Rental` เป็นตัวเชื่อม (Junction Table)
            - *Reference:* `rental.entity.ts` - ใช้ `@ManyToOne` เชื่อมทั้ง User และ Equipment เข้าด้วยกัน
        - **Reliability (ACID Transactions):**
            - *Rationale:* ในระบบการเงินหรือการตัด Stock ความถูกต้องสำคัญที่สุด ห้ามมีกรณี "ตัดของไปแล้ว แต่บันทึกประวัติการยืมล้มเหลว" (ของหายฟรี) Transaction จะช่วยให้มั่นใจว่า ทุกขั้นตอนต้องสำเร็จพร้อมกัน หรือถ้าพลาดก็ยกเลิกทั้งหมด (Atomic)
            - *Reference:* `rentals.service.ts` - แม้ในโค้ดปัจจุบันเราอาจใช้ TypeORM save ปกติ แต่ TypeORM จะหุ้มคำสั่ง SQL เหล่านั้นเป็น Transaction ให้อัตโนมัติเมื่อมีการบันทึกข้อมูลที่มีความสัมพันธ์กันหลายตาราง เพื่อความปลอดภัยของข้อมูล
        - **Dockerized Environment:**
            - *Rationale:* แก้ปัญหา "It works on my machine" โดยการจำลองสภาพแวดล้อมของ Database ให้เหมือนกันเป๊ะๆ ในเครื่องของ Developer ทุกคน
            - *Reference:* `docker-compose.yml` - คำสั่ง `image: postgres:14` ระบุชัดเจนว่าเราใช้ PostgreSQL เวอร์ชัน 14 ทุกคนในทีมจึงได้ database ตัวเดียวกันเป๊ะๆ โดยไม่ต้องลงโปรแกรมเพิ่ม แค่รัน `docker-compose up` ก็พร้อมใช้งาน

### 📖 อธิบาย Architecture Diagram

| Layer | เทคโนโลยี | หน้าที่หลัก |
|-------|----------|-------------|
| **Frontend** | React + Vite + TypeScript | UI สำหรับ User/Admin, จัดการ state ด้วย Context API |
| **HTTP Client** | Axios + Interceptors | แนบ JWT token อัตโนมัติทุก request, จัดการ error |
| **Backend** | NestJS + TypeScript | REST API, Business Logic, Guards สำหรับ Auth/Role |
| **ORM** | TypeORM | Mapping Object ↔ Database, Query Builder |
| **Database** | PostgreSQL (Docker) | เก็บข้อมูลถาวร, รองรับ UUID, Enum, Relations |

### 🔄 Data Flow ตัวอย่าง: User จองอุปกรณ์

```
User กด "Book Now"
       ↓
Frontend: CartButton.tsx → apiClient.post('/rentals', {...})
       ↓
axios Interceptor: แนบ Header "Authorization: Bearer <JWT>"
       ↓
Backend: RentalsController.create() → @UseGuards(JwtAuthGuard)
       ↓
Guard: jwt.strategy.ts ตรวจ token → inject user เข้า request
       ↓
Service: rentals.service.ts.create()
  - ตรวจ date validation
  - checkOverlap() → Query overlapping rentals
  - สร้าง Rental entity
       ↓
TypeORM: INSERT INTO rentals VALUES (...)
       ↓
Response กลับ Frontend → แสดง success message
```

---

## 📂 โครงสร้างโปรเจกต์

```
mini_project/
├── backend/                    # NestJS Backend API
│   └── src/
│       ├── auth/              # 🔐 Authentication (14 files)
│       │   ├── auth.controller.ts    # POST /login, /register
│       │   ├── auth.service.ts       # validateUser(), login()
│       │   ├── jwt.strategy.ts       # Passport JWT Strategy
│       │   ├── guards/               # jwt-auth.guard, role.guard
│       │   └── decorators/           # @CurrentUser, @Public, @Roles
│       ├── users/             # 👤 User Management (6 files)
│       ├── equipments/        # 📦 Equipment & Items (8 files)
│       ├── rentals/           # 📋 Rental Transactions (7 files)
│       ├── audit-logs/        # 📝 Activity Logging (5 files)
│       └── common/            # 🔧 Shared Enums, Filters, Middleware
│
├── frontend/                   # React Frontend
│   └── src/
│       ├── pages/             # 📄 9 หน้าหลัก
│       ├── components/        # 🧩 8 Reusable Components
│       ├── api/               # 🔗 API Client (axios)
│       ├── context/           # 🔄 CartContext (Cart with Expiry)
│       └── types.ts           # 📝 TypeScript Interfaces
│
└── docker-compose.yml          # 🐳 PostgreSQL Container
```

---

## 🗄️ Database Schema (4 Tables + Relations)

### Entity Relationship Diagram

```
┌────────────────┐       ┌────────────────────┐       ┌───────────────────┐
│     users      │       │    equipments      │       │  equipment_items  │
├────────────────┤       ├────────────────────┤       ├───────────────────┤
│ id (PK, UUID)  │       │ id (PK, UUID)      │←──────│ equipmentId (FK)  │
│ studentId      │       │ name               │       │ id (PK, UUID)     │
│ name           │       │ category           │       │ itemCode          │
│ password (hash)│       │ status (ENUM)      │       │ status (ENUM)     │
│ role (ENUM)    │       │ stockQty           │       └───────────────────┘
└────────────────┘       │ imageUrl           │                │
        │                └────────────────────┘                │
        │                         │                            │
        │    ┌────────────────────┴────────────────────────────┘
        │    │
        ▼    ▼
┌─────────────────────────────────────────────────────────────────┐
│                           rentals                               │
├─────────────────────────────────────────────────────────────────┤
│ id (PK, UUID)                                                   │
│ userId (FK) ──────────→ users.id                                │
│ equipmentId (FK) ─────→ equipments.id                           │
│ equipmentItemId (FK) ─→ equipment_items.id (nullable)           │
│ startDate, endDate (TIMESTAMP)                                  │
│ status (ENUM: 6 สถานะ)                                          │
│ requestDetails, attachmentUrl, rejectReason                     │
│ createdAt                                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Enum Values ที่ใช้ในระบบ

```typescript
// สถานะผู้ใช้
enum UserRole { ADMIN, USER }

// สถานะ Rental Transaction (6 สถานะ)
enum RentalStatus {
  PENDING,      // รอ Admin อนุมัติ
  APPROVED,     // อนุมัติแล้ว รอรับอุปกรณ์
  CHECKED_OUT,  // รับอุปกรณ์ไปแล้ว
  RETURNED,     // คืนแล้ว
  REJECTED,     // ถูกปฏิเสธ
  CANCELLED     // ยกเลิกโดย User
}

// สถานะอุปกรณ์หลัก
enum EquipmentStatus { AVAILABLE, MAINTENANCE, UNAVAILABLE }

// สถานะอุปกรณ์แต่ละชิ้น
enum EquipmentItemStatus { AVAILABLE, UNAVAILABLE, RENTED }
```

---

## 📊 Rental Status Flow (State Machine)

```
                    ┌──────────────────────────────────────────┐
                    │         State Machine Diagram            │
                    └──────────────────────────────────────────┘
     
     User กด "Book Now" (CartButton.tsx → submitRentals())
                    │
                    ▼
              ┌─────────┐
              │ PENDING │ ◄──── สร้าง Rental ใหม่ (status = PENDING)
              └────┬────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
   Admin Reject  Admin    User Cancel
        │       Approve       │
        ▼          │          ▼
  ┌──────────┐     │    ┌───────────┐
  │ REJECTED │     │    │ CANCELLED │
  └──────────┘     │    └───────────┘
        ▲          ▼          ▲
        │    ┌───────────┐    │
        │    │ APPROVED  │────┘ (User ยังยกเลิกได้)
        │    └─────┬─────┘
        │          │
        │    Admin Checkout (item.status → RENTED)
        │          │
        │          ▼
        │   ┌─────────────┐
        │   │ CHECKED_OUT │
        │   └──────┬──────┘
        │          │
        │    Admin Return (item.status → AVAILABLE)
        │          │
        │          ▼
        │    ┌──────────┐
        └────│ RETURNED │ ◄──── จบ Transaction
             └──────────┘
```

**คำอธิบาย Flow สถานะ (State Machine Description):**
1. **PENDING**: เมื่อ User กดจอง (Book Now), ระบบจะสร้าง Rental record ใหม่และตั้งสถานะเริ่มต้นเป็น `PENDING` เพื่อรอการตรวจสอบจาก Admin
    - ในขั้นตอนนี้ **Admin** สามารถกด `Approve` หรือ `Reject` ได้
    - **User** สามารถกด `Cancel` ได้หากเปลี่ยนใจ
2. **APPROVED**: เมื่อ Admin อนุมัติ, สถานะจะเปลี่ยนเป็น `APPROVED`
    - ระบบจะทำการ **Auto-Reject** คำขออื่นๆ ที่จองช่วงเวลาซ้อนทับกันโดยอัตโนมัติ (เพื่อป้องกัน Double Booking)
    - ณ จุดนี้ User ยังสามารถ `Cancel` ได้อยู่
3. **CHECKED_OUT**: เมื่อ User มารับของ, Admin จะเปลี่ยนสถานะเป็น `CHECKED_OUT` (รับของแล้ว)
    - ระบบจะตัด Stock โดยเปลี่ยนสถานะของ *EquipmentItem* ชิ้นนั้นเป็น `RENTED` ทันที
4. **RETURNED**: เมื่อ User นำของมาคืน, Admin จะเปลี่ยนสถานะเป็น `RETURNED`
    - ระบบจะคืน Stock โดยเปลี่ยนสถานะของ *EquipmentItem* กลับเป็น `AVAILABLE` เพื่อให้ผู้อื่นจองต่อได้
5. **REJECTED / CANCELLED**: เป็นสถานะสิ้นสุด (Terminal States) หากถูกปฏิเสธหรือยกเลิก จะไม่สามารถเปลี่ยนสถานะต่อได้อีก

### State Transition Rules (ใน `validateStatusTransition()`)

```typescript
const allowedTransitions = {
  PENDING:     [APPROVED, REJECTED, CANCELLED],
  APPROVED:    [CHECKED_OUT, CANCELLED],
  CHECKED_OUT: [RETURNED],
  RETURNED:    [],  // Terminal state
  REJECTED:    [],  // Terminal state
  CANCELLED:   [],  // Terminal state
};
```

---

## 🔐 Authentication Flow (JWT + Passport)

### Login Sequence Diagram

```
┌──────────┐          ┌──────────────────┐          ┌─────────────────┐
│  Client  │          │  AuthController  │          │   AuthService   │
└────┬─────┘          └────────┬─────────┘          └────────┬────────┘
     │                         │                              │
     │ POST /auth/login        │                              │
     │ { studentId, password } │                              │
     │ ───────────────────────►│                              │
     │                         │ validateUser(studentId, pw)  │
     │                         │ ─────────────────────────────►
     │                         │                              │
     │                         │     ┌────────────────────────┤
     │                         │     │ 1. findByStudentId()   │
     │                         │     │ 2. bcrypt.compare()    │
     │                         │     │ 3. return user (no pw) │
     │                         │     └────────────────────────┤
     │                         │                              │
     │                         │ login(user)                  │
     │                         │ ─────────────────────────────►
     │                         │                              │
     │                         │     ┌────────────────────────┤
     │                         │     │ jwtService.sign({      │
     │                         │     │   sub: user.id,        │
     │                         │     │   studentId,           │
     │                         │     │   role                 │
     │                         │     │ })                     │
     │                         │     └────────────────────────┤
     │                         │                              │
     │ { accessToken, user }   │ ◄─────────────────────────────
     │ ◄───────────────────────│                              │
     │                         │                              │
     │ localStorage.setItem('token', accessToken)             │
     │                         │                              │
```

**คำอธิบายการทำงาน (Sequence Description):**
1. **Client** (Browser) ส่งข้อมูล `studentId` และ `password` ผ่าน method `POST /auth/login` ไปยัง **AuthController** เพื่อขอเข้าสู่ระบบ
2. **AuthController** เรียกฟังก์ชัน `validateUser()` ใน **AuthService** เพื่อตรวจสอบความถูกต้องของข้อมูล
    - **AuthService** ค้นหา user จาก database ด้วย `studentId`
    - หากพบ user, จะนำ password ที่ส่งเข้ามา ไปตรวจสอบกับ Hash ในฐานข้อมูลด้วย `bcrypt.compare()`
    - หากถูกต้อง, จะส่งคืน object `user` กลับไป (โดยตัด field password ออกเพื่อความปลอดภัย)
3. **AuthController** เรียกฟังก์ชัน `login(user)` ใน **AuthService** เพื่อสร้าง Token
    - **AuthService** ใช้ library `jwtService` สร้าง (Sign) JWT Token โดยบรรจุข้อมูลสำคัญ (Payload) เช่น `userId`, `studentId`, และ `role`
4. **AuthService** ส่งคืน object ที่มี `accessToken` และข้อมูล `user` กลับไปยัง **AuthController**
5. **AuthController** ส่ง Response ตอบกลับไปยัง **Client**
6. **Client** ทำการบันทึก `accessToken` ลงใน `localStorage` เพื่อใช้แนบไปกับ Request ครั้งถัดๆ ไป (สำหรับยืนยันตัวตนใน API อื่นๆ)

### Key Files และหน้าที่

| File | หน้าที่ | Code Highlight |
|------|--------|----------------|
| `auth.service.ts` | ตรวจ password + สร้าง JWT | `bcrypt.compare()` + `jwtService.sign()` |
| `jwt.strategy.ts` | Decode JWT + Load User | `ExtractJwt.fromAuthHeaderAsBearerToken()` |
| `jwt-auth.guard.ts` | ป้องกัน route ที่ต้อง login | Check `@Public()` decorator |
| `role.guard.ts` | ตรวจ role (Admin/User) | `requiredRoles.includes(user.role)` |
| `@CurrentUser()` | Decorator ดึง user จาก request | `req.user` (injected by strategy) |

### JWT Token Structure

```javascript
// Payload ที่เก็บใน Token
{
  "sub": "uuid-of-user",      // User ID
  "studentId": "6810110229",
  "role": "USER",             // หรือ "ADMIN"
  "iat": 1704790800,          // issued at
  "exp": 1704877200           // expires
}
```

---

## ⚙️ Backend Modules (NestJS) - Deep Dive

### 1. `AuthModule` - การยืนยันตัวตน

```typescript
// auth.service.ts - Core Logic
async validateUser(studentId: string, pass: string) {
  const user = await usersService.findOneByStudentId(studentId);
  if (!user) return null;
  
  const isMatch = await bcrypt.compare(pass, user.password);
  if (isMatch) {
    const { password, ...result } = user;  // ไม่ส่ง password กลับ
    return result;
  }
  return null;
}

async login(user: any) {
  const payload = { sub: user.id, studentId: user.studentId, role: user.role };
  return {
    accessToken: this.jwtService.sign(payload),
    user: { id, studentId, name, role }
  };
}
```

### 2. `RentalsModule` - หัวใจของระบบ (⭐ ซับซ้อนที่สุด)

**Key Endpoints:**

| Method | Endpoint | Guard | หน้าที่ |
|--------|----------|-------|--------|
| `POST` | `/rentals` | JWT | สร้าง rental ใหม่ |
| `POST` | `/rentals/check-overlap` | JWT | ตรวจจองซ้อนก่อนยืนยัน |
| `GET` | `/rentals` | JWT | ดู rental ทั้งหมด (Admin) |
| `GET` | `/rentals/me` | JWT | ดู rental ของตัวเอง |
| `GET` | `/rentals/equipment/:id/active` | JWT | ดู rentals ของอุปกรณ์ |
| `PATCH` | `/rentals/:id/status` | JWT | เปลี่ยนสถานะ |

**Logic สำคัญใน `rentals.service.ts` (310 lines):**

#### 2.1 `create()` - สร้างการยืม

```typescript
async create(userId: string, createRentalDto: CreateRentalDto) {
  const { equipmentId, equipmentItemId, startDate, endDate, allowOverlap } = dto;
  
  // 1. Validate dates
  if (start >= end) throw BadRequestException('End must be after start');
  if (start < new Date()) throw BadRequestException('Cannot book past dates');
  
  // 2. Check item availability
  if (equipmentItemId) {
    const item = await equipmentItemRepository.findOne({ id: equipmentItemId });
    if (item.status !== 'AVAILABLE') throw BadRequestException('Item not available');
  }
  
  // 3. Check overlap (ถ้า allowOverlap = false)
  if (!allowOverlap) {
    const hasOverlap = await this.checkOverlap(equipmentId, start, end, undefined, equipmentItemId);
    if (hasOverlap) throw BadRequestException('Equipment already booked');
  }
  
  // 4. Create rental with PENDING status
  const rental = rentalRepository.create({ ...dto, status: 'PENDING' });
  await rentalRepository.save(rental);
  
  // 5. Log to audit
  await auditLogsService.log(userId, 'User', 'RENTAL_CREATE', rental.id, details);
  
  return rental;
}
```

#### 2.2 `checkOverlap()` - ตรวจจองซ้อน (⭐ สำคัญมาก)

```typescript
async checkOverlap(equipmentId, startDate, endDate, excludeRentalId?, equipmentItemId?) {
  const query = rentalRepository.createQueryBuilder('rental')
    .where('rental.equipmentId = :equipmentId', { equipmentId })
    // ไม่นับ rental ที่จบแล้ว
    .andWhere('rental.status NOT IN (:...excludedStatuses)', {
      excludedStatuses: ['RETURNED', 'REJECTED', 'CANCELLED']
    })
    // ⭐ Overlap Logic: A.start < B.end AND A.end > B.start
    .andWhere('rental.startDate < :endDate', { endDate })
    .andWhere('rental.endDate > :startDate', { startDate });
  
  // ถ้าระบุ item ให้ตรวจเฉพาะ item นั้น
  if (equipmentItemId) {
    query.andWhere('rental.equipmentItemId = :equipmentItemId', { equipmentItemId });
  }
  
  return (await query.getCount()) > 0;
}
```

**อธิบาย Overlap Algorithm:**
```
เวลาซ้อนกัน = A.start < B.end AND A.end > B.start

ตัวอย่าง:
  Rental A: 10-15 มกรา
  Rental B: 12-18 มกรา
  
  A.start(10) < B.end(18) ✓
  A.end(15) > B.start(12) ✓
  → ซ้อนกัน!
```

#### 2.3 `updateStatus()` - เปลี่ยนสถานะ + Auto-Reject

```typescript
async updateStatus(id: string, updateStatusDto) {
  const rental = await this.findOne(id);
  const { status: newStatus, rejectReason } = updateStatusDto;
  
  // 1. Validate transition
  this.validateStatusTransition(rental.status, newStatus);
  
  // 2. ⭐ Auto-reject overlapping PENDING rentals เมื่อ APPROVE
  let autoRejectedRentals = [];
  if (newStatus === 'APPROVED' && rental.status === 'PENDING') {
    const overlapping = await rentalRepository.createQueryBuilder('r')
      .where('r.id != :rentalId', { rentalId: id })
      .andWhere('r.equipmentItemId = :itemId', { itemId: rental.equipmentItemId })
      .andWhere('r.status = :status', { status: 'PENDING' })
      .andWhere('r.startDate < :endDate', { endDate: rental.endDate })
      .andWhere('r.endDate > :startDate', { startDate: rental.startDate })
      .getMany();
    
    for (const overlap of overlapping) {
      overlap.status = 'REJECTED';
      await rentalRepository.save(overlap);
      autoRejectedRentals.push(`${overlap.user.name} (${overlap.user.studentId})`);
      await auditLogsService.log(..., 'RENTAL_AUTO_REJECTED', ...);
    }
  }
  
  // 3. Handle stock logic
  if (newStatus === 'CHECKED_OUT') {
    item.status = 'RENTED';
    equipment.stockQty -= 1;
  } else if (newStatus === 'RETURNED') {
    item.status = 'AVAILABLE';
    equipment.stockQty += 1;
  }
  
  // 4. Save and log
  rental.status = newStatus;
  if (newStatus === 'REJECTED' && rejectReason) {
    rental.rejectReason = rejectReason;
  }
  
  return { ...savedRental, autoRejectedRentals };
}
```

### 3. `EquipmentsModule` - จัดการอุปกรณ์

```typescript
// equipments.service.ts - Auto-create items
async create(createEquipmentDto, userId?, username?) {
  const equipment = await equipmentRepository.save(dto);
  
  // Auto-create items based on stockQty
  const items = [];
  for (let i = 1; i <= stockQty; i++) {
    items.push({
      equipmentId: equipment.id,
      itemCode: String(i).padStart(3, '0'),  // "001", "002", ...
      status: 'AVAILABLE'
    });
  }
  await equipmentItemRepository.save(items);
  
  await auditLogsService.log(..., 'EQUIPMENT_CREATE', ...);
  return equipment;
}

// Handle stockQty increase
async update(id, updateDto) {
  if (newStockQty > oldStockQty) {
    // Add more items with sequential codes
    for (let i = currentMaxCode + 1; i <= newTotal; i++) {
      items.push({ itemCode: String(i).padStart(3, '0'), ... });
    }
  }
}
```

### 4. `AuditLogsModule` - บันทึก Activity

```typescript
// audit-logs.service.ts
async log(userId, username, actionType, rentalId?, details?) {
  return this.create({
    userId,
    username,
    actionType,    // e.g., 'RENTAL_CREATE', 'RENTAL_STATUS_APPROVED'
    rentalId,
    details        // JSON string of additional info
  });
}

// Action Types ในระบบ:
// - RENTAL_CREATE, RENTAL_AUTO_REJECTED
// - RENTAL_STATUS_PENDING/APPROVED/REJECTED/CHECKED_OUT/RETURNED/CANCELLED
// - EQUIPMENT_CREATE, EQUIPMENT_UPDATE, EQUIPMENT_DELETE
// - EQUIPMENT_ITEM_STATUS_UPDATE
```

---

## 🔄 API Client (Frontend) - Deep Dive

### `api/client.ts` - Axios Configuration

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' }
});

// ⭐ Request Interceptor: แนบ JWT token ทุก request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
```

### API Functions ที่ใช้ในแต่ละหน้า

```typescript
// Login/Register
apiClient.post('/auth/login', { studentId, password });
apiClient.post('/auth/register', { studentId, name, password });

// Equipment
apiClient.get('/equipments');                    // List all
apiClient.get(`/equipments/${id}`);              // Get detail with items
apiClient.post('/equipments', formData);         // Create (Admin)
apiClient.patch(`/equipments/${id}`, data);      // Update (Admin)
apiClient.delete(`/equipments/${id}`);           // Delete (Admin)

// Rentals
apiClient.post('/rentals', { equipmentId, equipmentItemId, startDate, endDate, allowOverlap });
apiClient.post('/rentals/check-overlap', { equipmentId, equipmentItemId, startDate, endDate });
apiClient.get('/rentals');                       // All rentals (Admin)
apiClient.get('/rentals/me');                    // My rentals
apiClient.patch(`/rentals/${id}/status`, { status, rejectReason? });

// Audit Logs
apiClient.get('/audit-logs');                    // All logs (Admin)
```

---

## 🖥️ Frontend Logic Deep Dive

### 1. 🛒 ระบบรายการจอง (Reservation Cart)
ระบบตะกร้าถูกออกแบบให้มีอายุการใช้งาน (Expiry) เพื่อป้องกันการกั๊กของ
- **Logic การทำงาน:**
  1. เมื่อ User กดหยิบของใส่รายการ `addToCart()`, ระบบจะบันทึก `timestamp` ปัจจุบัน และคำนวณ `expiresAt` (เช่น 15 นาทีหลังจากนี้)
  2. ข้อมูลถูกเก็บลง `localStorage` เพื่อให้ไม่หายเวลารีเฟรชหน้าจอ
  3. `useEffect` จะทำงานทุกๆ 1 วินาที เพื่อวนลูปเช็คสินค้าในรายการ
  4. หากพบสินค้าที่ `expiresAt < Date.now()` (หมดเวลา), สินค้านั้นจะถูกลบออกจาก `state` และ `localStorage` ทันที

### 2. 📸 กระบวนการอัปโหลดหลักฐาน (Evidence Upload Process)
ฟีเจอร์นี้ช่วยให้ Admin ตรวจสอบสภาพของอุปกรณ์ได้ทั้งตอนรับและคืนของ
- **Flow การทำงาน:**
  1. **File Selection**: User เลือกรูปภาพ → `handleFileChange` ตรวจสอบขนาดไฟล์ (>5MB จะแจ้งเตือน)
  2. **Preview Generation**: ใช้ `URL.createObjectURL(file)` สร้าง URL ชั่วคราวเพื่อแสดงรูปตัวอย่างทันทีโดยไม่ต้องรอโหลดขึ้น Server
  3. **Form Submission**:
     - สร้าง `FormData` object
     - แนบไฟล์ภาพ (`image`) และประเภท (`imageType: 'checkout' | 'return'`)
     - แนบข้อความ (`note`) ถ้ามี
  4. **API Call**: ส่ง POST Request ไปยัง `/rentals/:id/upload-image`
  5. **Completion**: เมื่อสำเร็จ, Modal จะปิดและ Callback `onSuccess` จะทำงานเพื่อรีเฟรชหน้าจอแสดง Status Badge ใหม่

---

## 🧩 Key Components - Deep Dive

### 1. `CartContext.tsx` - Cart with Expiry (⭐ สำคัญ)

```typescript
// Configuration
const CART_STORAGE_KEY = 'rentalCart';
const CART_EXPIRY_MINUTES = 15;

interface CartItem {
  itemId: string;
  itemCode: string;
  equipmentId: string;
  equipmentName: string;
  equipmentImage?: string;
  addedAt: number;
  expiresAt: number;      // ⭐ หมดอายุหลัง 15 นาที
}

// Provider Logic
function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    // Load from localStorage + filter expired items
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = JSON.parse(saved);
    return parsed.filter(item => item.expiresAt > Date.now());
  });
  
  // ⭐ Auto-remove expired items every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCartItems(prev => prev.filter(item => item.expiresAt > Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  const addToCart = (item) => {
    const newItem = {
      ...item,
      addedAt: Date.now(),
      expiresAt: Date.now() + CART_EXPIRY_MINUTES * 60 * 1000  // 15 min later
    };
    setCartItems(prev => [...prev, newItem]);
  };
  
  return <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, isInCart, getTimeRemaining }}>
    {children}
  </CartContext.Provider>;
}
```

### 2. `CartButton.tsx` (RentalListButton) - 538 lines

**หน้าที่หลัก:**
- แสดง cart icon + item count
- เปิด drawer แสดงรายการ
- เลือกวัน/เวลา (DateRangePicker)
- ตรวจ overlap ก่อนยืนยัน
- Submit rentals ไปยัง Backend

**Key Functions:**

```typescript
// 1. Check for overlaps before confirming
async function checkForOverlaps(): Promise<boolean> {
  for (const item of cartItems) {
    const response = await apiClient.post('/rentals/check-overlap', {
      equipmentId: item.equipmentId,
      equipmentItemId: item.itemId,
      startDate, endDate
    });
    if (response.data.hasOverlap) {
      setOverlappingItems([...response.data.overlappingRentals]);
      return true;
    }
  }
  return false;
}

// 2. Handle confirm click
async function handleConfirmClick() {
  const hasOverlap = await checkForOverlaps();
  if (hasOverlap) {
    setShowOverlapWarning(true);  // แสดง warning modal
  } else {
    await submitRentals();
  }
}

// 3. Submit rentals (with optional allowOverlap)
async function submitRentals(allowOverlap = false) {
  for (const item of cartItems) {
    await apiClient.post('/rentals', {
      equipmentId: item.equipmentId,
      equipmentItemId: item.itemId,
      startDate, endDate,
      allowOverlap    // ⭐ ถ้า user เลือก "Proceed Anyway"
    });
  }
  clearCart();
  navigate('/my-rentals');
}
```

### 3. `ProtectedRoute.tsx` - Route Guard

```typescript
function ProtectedRoute({ children, requireAdmin = false }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireAdmin && user.role !== 'ADMIN') {
    return <Navigate to="/equipments" replace />;
  }
  
  return children;
}

// Usage in App.tsx
<Route path="/admin/*" element={
  <ProtectedRoute requireAdmin>
    <AdminLayout />
  </ProtectedRoute>
} />
```

### 4. `RentalStatusBadge.tsx` - Status Badge Component

```typescript
const statusConfig = {
  PENDING:     { color: 'yellow', label: 'Pending' },
  APPROVED:    { color: 'blue',   label: 'Approved' },
  CHECKED_OUT: { color: 'purple', label: 'Checked Out' },
  RETURNED:    { color: 'green',  label: 'Returned' },
  REJECTED:    { color: 'red',    label: 'Rejected' },
  CANCELLED:   { color: 'gray',   label: 'Cancelled' }
};

function RentalStatusBadge({ status }) {
  const config = statusConfig[status];
  return <span className={`badge badge-${config.color}`}>{config.label}</span>;
}
```

---

## 🌟 Key Features สำหรับ Demo

### 1. ✅ Overlap Detection (ป้องกันจองซ้อน)

**Flow:**
1. User เลือก item + วันที่ → กด Confirm
2. Frontend เรียก `POST /rentals/check-overlap`
3. ถ้าซ้อน → แสดง warning พร้อมรายละเอียด
4. User เลือก: เปลี่ยนวัน หรือ Proceed Anyway
5. เมื่อ Admin approve → auto-reject overlapping PENDING rentals

### 2. 🛒 ระบบรายการจอง (Reservation Cart with Expiry)

- รายการที่เลือกจะหมดอายุหลัง **15 นาที** (เพื่อไม่ให้กั๊กของ)
- แสดงตัวนับถอยหลัง (Countdown timer)
- ลบรายการที่หมดอายุอัตโนมัติ (Auto-remove)
- เก็บสถานะใน localStorage (ปิดหน้าเว็บแล้วกลับมาข้อมูลยังอยู่)

### 3. 📊 การจัดการแบบกลุ่ม (Batch Actions - Admin)

- เลือกรายการได้หลายรายการพร้อมกัน (Checkbox)
- กด "Approve Selected" หรือ "Reject Selected" ทีเดียวได้
- ระบบประมวลผลทีละรายการด้วย Promise.all()

### 4. 📝 บันทึกกิจกรรม (Audit Trail)

- เก็บ Log ทุกการกระทำที่สำคัญ
- บันทึก userId, username, actionType, rentalId, details
- ใช้สำหรับตรวจสอบย้อนหลัง (Traceability) และ Debugging

### 5. 🔐 ระบบจัดการสิทธิ์ (Role-Based Access Control)

| Feature | User | Admin |
|---------|------|-------|
| ดูอุปกรณ์ | ✅ | ✅ |
| ยืมอุปกรณ์ | ✅ | ✅ |
| ดูประวัติการยืมตัวเอง | ✅ | ✅ |
| ยกเลิกการยืมตัวเอง | ✅ | ✅ |
| ดูรายการยืมทั้งหมด | ❌ | ✅ |
| อนุมัติ/ปฏิเสธ (Approve/Reject) | ❌ | ✅ |
| ยืนยันรับของ/คืนของ (Checkout/Return) | ❌ | ✅ |
| จัดการอุปกรณ์ (CRUD Equipment) | ❌ | ✅ |
| ดู Audit Logs | ❌ | ✅ |

---

## 🚀 วิธีรันโปรเจกต์ (How to Run)

```bash
# 1. Start PostgreSQL
docker-compose up -d

# 2. Start Backend
cd backend
npm install
npm run start:dev    # http://localhost:3000

# 3. Start Frontend
cd frontend
npm install
npm run dev          # http://localhost:5173
```

---

## 📌 สิ่งที่ควรเน้นใน Pitching

1.  **Problem → Solution** ชัดเจน (Excel → Web App)
2.  **Architecture** 3-tier + ความสัมพันธ์ระหว่าง layer
3.  **State Machine** ของสถานะการยืม + validation rules
4.  **Overlap Detection** อัลกอริทึมตรวจสอบวันซ้อน + auto-reject
5.  **Security** ใช้ JWT + Role Guard + bcrypt
6.  **UX** ที่ใส่ใจรายละเอียด (ระบบรายการจองหมดอายุ, การจัดการแบบกลุ่ม, แจ้งเตือนเมื่อจองซ้อน)

---

## 🎤 Demo Flow แนะนำ (5 นาที)

| เวลา | สิ่งที่ทำ |
|------|----------|
| 0:00-0:30 | Intro: ปัญหา Excel → Solution Web App |
| 0:30-2:00 | Demo User: login → ดูอุปกรณ์ → เลือกรายการ → ใส่รายการจอง → ยืนยันการจอง |
| 2:00-3:30 | Demo Admin: login → ดูรายการที่รออนุมัติ → Approve → แสดงระบบ Auto-reject |
| 3:30-4:00 | Show: Architecture diagram + Data Flow |
| 4:00-4:30 | Tech highlight: โชว์โค้ดส่วน Overlap detection |
| 4:30-5:00 | สรุป + Q&A |

---

## ❓ Potential Q&A (In-depth Questions)

### Q1: ทำไมถึงเลือกใช้ JWT แทน Session?
**A:** เพราะระบบนี้ออกแบบเป็น **Stateless Architecture** ครับ
- **Scalability:** ถ้าในอนาคตคนใช้เยอะ เราสามารถเพิ่ม server ได้ง่ายโดยไม่ต้อง sync session กัน
- **Mobile-Ready:** JWT รองรับการใช้งานผ่าน Mobile App ในอนาคตได้ดีกว่า Cookie-based session
- **Performance:** ลดโหลด database เพราะไม่ต้อง query session table ทุกครั้งที่ user request เข้ามา เพียงแค่ verify signature ของ token ก็รู้ตัวตนแล้วครับ

### Q2: ถ้าเกิด Race Condition ตอนจองของพร้อมกัน 2 คน จะป้องกันยังไง?
**A:** ระบบมี **Transaction** และ **Locking Mechanism** ใน Database ครับ
1. ใช้ `read-committed` isolation level ของ PostgreSQL
2. ก่อนบันทึก `RentalsService` จะตรวจสอบ Overlap ด้วย Query ที่แม่นยำ
3. ในกรณีที่กดพร้อมกันระดับ millisecond จริงๆ Database จะยอมให้ Transaction แรกสำเร็จ ส่วน Transaction ที่สองจะเจอ Overlap (เพราะ record แรกถูก commit ไปแล้ว) และดีด error กลับไป ทำให้ข้อมูลไม่พังครับ

### Q3: ทำไมต้องมี Auto-Reject? ทำไมไม่บล็อกตั้งแต่กดจอง? (UX vs Logic)
**A:** เราต้องการความยืดหยุ่น (Flexibility) ครับ
- ถ้า User คนแรก (A) จองไว้แต่ยัง *Pending* การที่เราบล็อก User คนที่สอง (B) ไม่ให้จองเลย อาจทำให้เสียโอกาสหาก Admin ตัดสินใจปฏิเสธ A
- ระบบนี้จึงอนุญาตให้จองซ้อนได้ในสถานะ *Pending* (Soft Reservation) แต่เมื่อ Admin ตัดสินใจ *Approve* A ระบบถึงจะไปไล่ตัด (Kill) คำขออื่นๆ ที่ซ้อนกันทิ้งอัตโนมัติ เพื่อให้ได้ utilization สูงสุดครับ

### Q4: ระบบตะกร้าเก็บใน localStorage มันจะปลอดภัยเหรอ? ถ้า User แก้ข้อมูลเองล่ะ?
**A:** ข้อมูลใน localStorage เป็นแค่ **Client-Side State** เพื่อความสะดวก (UX) เท่านั้นครับ
- ข้อมูลระยะเวลาหรือสิทธิ์การจอง **ไม่ได้เชื่อข้อมูลจาก Client 100%**
- เมื่อกด **Confirm**, Backend จะรับแค่ `equipmentId` กับ `date` แล้วไปคำนวณวันว่างและตรวจสอบสิทธิ์ใหม่ทั้งหมดที่ Server (Server-Side Validation)
- ดังนั้นต่อให้ User แก้ localStorage มั่วๆ Backend ก็จะตรวจเจอและ reject request นั้นอยู่ดีครับ

### Q5: ทำไมถึงใช้ Next.js/React ทั้งที่ระบบนี้ CRUD ธรรมดา?
**A:** เพื่อ **Interactive Experience** ที่ดีกว่าครับ
- ระบบมีการจองที่ต้องเลือกช่วงเวลา (Date Range Picker) และการคำนวณ Overlap แบบ Real-time
- การใช้ React ทำให้เราทำ **Optimistic UI** (กดปุ่มแล้ว ui เปลี่ยนทันทีไม่ต้องรอโหลด)
- และที่สำคัญคือ **Component Reusability** เช่น `RentalCard` ที่ใช้ซ้ำทั้งหน้า User และ Admin ทำให้ code maintain ง่ายกว่าการเขียน template engine ฝั่ง server ครับ

### 6. 🤖 ตัวอย่าง Prompt ที่ใช้สั่งงาน AI (สำหรับส่งรายงาน)

เพื่อให้ครบถ้วนตามความต้องการของรายวิชา นี่คือตัวอย่าง Prompt หลักๆ ที่ใช้ในการพัฒนา:

1.  **Architecture Design (ออกแบบสถาปัตยกรรม):**
    > "ช่วยรับบทเป็น Senior Software Architect ออกแบบระบบยืมคืนอุปกรณ์ของชมรมมหาวิทยาลัยให้หน่อยครับ โจทย์คือต้องมี Backend เป็น NestJS (เชื่อมต่อ PostgreSQL ผ่าน TypeORM) และ Frontend เป็น React (Vite) ระบบต้องรองรับการจองซ้อน (Overlap Booking), แบ่งสิทธิ์ Admin/User, และมีการยืนยันตัวตนผ่าน JWT ช่วยร่าง Database Schema และโครงสร้าง API ให้หน่อยครับ"

2.  **Algorithm Implementation (Logic การตรวจสอบ):**
    > "ช่วยเขียนฟังก์ชัน TypeScript สำหรับ NestJS Service เพื่อตรวจสอบการจองซ้อน (Overlap Detection) หน่อยครับ input คือ equipmentId, startDate, และ endDate โดยให้ใช้ QueryBuilder ในการเช็คกับ Database ว่าช่วงเวลานี้มีใครจองไปหรือยัง"

3.  **Frontend State Management (ระบบตะกร้า):**
    > "ช่วยสร้าง React Context สำหรับทำระบบตะกร้าสินค้า (Shopping Cart) ให้หน่อยครับ โดยมีเงื่อนไขว่าสินค้าต้องหมดอายุอัตโนมัติภายใน 15 นาที (Auto-expire) และให้เก็บข้อมูลลง localStorage เพื่อกันข้อมูลหายเวลารีเฟรชหน้าจอ"

4.  **UI/UX Generation (ออกแบบหน้าจอ):**
    > "ช่วยเขียน Component 'RentalCard' ของ React โดยใช้ Tailwind CSS ตกแต่งสไตล์ Glassmorphism ให้ดูโมเดิร์นหน่อยครับ และให้แสดง Badge สถานะ (Pending, Approved, Rejected) เป็นสีต่างๆ กันด้วย"

---

## 📌 Checklist ส่งงาน (Grading Criteria Check)

- [x] **Backend Architecture (30%)**: ใช้ NestJS + TypeORM + Docker + ออกแบบ Database (มีความสัมพันธ์ One-to-Many และ Many-to-Many ที่ถูกต้องโดยใช้ตาราง Rental)
- [x] **Frontend Implementation (30%)**: ใช้ React + TypeScript (Strict Types) + มีการแยก Component เพื่อนำกลับมาใช้ซ้ำ (Reusability)
- [x] **Integration & Auth (20%)**: เชื่อมต่อ API จริง + ระบบ JWT Authentication + มี Protected Routes และ axios interceptors
- [x] **Functionality (20%)**: ระบบตรวจสอบการจองซ้อน (Overlap Detection) + Auto-Reject + ตัด Stock จริง + แยกสิทธิ์ Admin/User ได้สมบูรณ์
