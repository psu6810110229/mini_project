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
└────────────────────────────│───────────────────────────────────────────┘
                             │ REST API (JWT Auth)
┌────────────────────────────│───────────────────────────────────────────┐
│                           BACKEND (NestJS)                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │    Auth     │ │   Users     │ │  Equipments │ │   Rentals   │       │
│  │   Module    │ │   Module    │ │   Module    │ │   Module    │       │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │
│                            │                                           │
│                      TypeORM (ORM)                                     │
└────────────────────────────│───────────────────────────────────────────┘
                             │
┌────────────────────────────│───────────────────────────────────────────┐
│                       DATABASE (PostgreSQL)                            │
│  ┌─────────┐ ┌───────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │  users  │ │  equipments   │ │ equipment_items │ │    rentals      │ │
│  └─────────┘ └───────────────┘ └─────────────────┘ └─────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

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

### 2. 🛒 Shopping Cart with Expiry

- Item หมดอายุหลัง **15 นาที**
- แสดง countdown timer
- Auto-remove expired items
- เก็บใน localStorage (persist across refresh)

### 3. 📊 Batch Actions (Admin)

- เลือก checkbox หลาย rental
- กด "Approve Selected" / "Reject Selected"
- Process ทีละ rental ด้วย Promise.all()

### 4. 📝 Audit Trail

- Log ทุก action สำคัญ
- เก็บ userId, username, actionType, rentalId, details
- ใช้สำหรับ traceability และ debugging

### 5. 🔐 Role-Based Access Control

| Feature | User | Admin |
|---------|------|-------|
| ดูอุปกรณ์ | ✅ | ✅ |
| ยืมอุปกรณ์ | ✅ | ✅ |
| ดู rental ตัวเอง | ✅ | ✅ |
| ยกเลิก rental ตัวเอง | ✅ | ✅ |
| ดู rental ทั้งหมด | ❌ | ✅ |
| Approve/Reject | ❌ | ✅ |
| Checkout/Return | ❌ | ✅ |
| จัดการอุปกรณ์ | ❌ | ✅ |
| ดู Audit Logs | ❌ | ✅ |

---

## 🚀 How to Run

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

1. **Problem → Solution** ชัดเจน (Excel → Web App)
2. **Architecture** 3-tier + ความสัมพันธ์ระหว่าง layer
3. **State Machine** ของ Rental Status + validation rules
4. **Overlap Detection** algorithm + auto-reject logic
5. **Security** JWT + Role Guard + bcrypt
6. **UX** ที่คิดมาแล้ว (Cart expiry, Batch actions, Warning dialogs)

---

## 🎤 Demo Flow แนะนำ (5 นาที)

| เวลา | สิ่งที่ทำ |
|------|----------|
| 0:00-0:30 | Intro: ปัญหา Excel → Solution Web App |
| 0:30-2:00 | Demo User: login → ดูอุปกรณ์ → เลือก item → ใส่ cart → จอง |
| 2:00-3:30 | Demo Admin: login → ดู pending → Approve → แสดง auto-reject |
| 3:30-4:00 | Show: Architecture diagram + Data Flow |
| 4:00-4:30 | Tech highlight: Overlap detection code snippet |
| 4:30-5:00 | สรุป + Q&A |

---

> **💡 Pro Tip:** ถ้าโดนถามเชิงลึก ให้ตอบด้วย "มันทำงานโดย..." แล้วอธิบาย data flow:
> `Frontend Component` → `axios (แนบ JWT)` → `Controller` → `Guard (ตรวจ auth)` → `Service (business logic)` → `Repository (TypeORM)` → `PostgreSQL`
