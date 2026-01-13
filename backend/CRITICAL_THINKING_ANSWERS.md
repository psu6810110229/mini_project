# 📝 คำตอบ Critical Thinking สำหรับระบบ Gear Rental Backend

---

## 1. Architecture & Design Patterns

### คำถามที่ 1
**ทำไมต้องแยก Module ออกเป็น `auth`, `users`, `equipments`, `rentals`, `audit-logs` แทนที่จะรวมไว้ใน Module เดียว?**

**ข้อดีของ Modular Architecture:**
1. **Separation of Concerns** - แต่ละ module จัดการเรื่องของตัวเอง ไม่ปะปนกัน
2. **Maintainability** - ง่ายต่อการแก้ไข เพราะรู้ว่าโค้ดอยู่ตรงไหน
3. **Testability** - สามารถเขียน unit test แยกแต่ละ module ได้
4. **Scalability** - สามารถแยก module ไป microservice ได้ในอนาคต
5. **Team Collaboration** - หลายคนทำงานพร้อมกันได้โดยไม่ conflict

**ข้อเสีย:**
1. **Boilerplate** - ต้องสร้างหลายไฟล์สำหรับแต่ละ module
2. **Circular Dependencies** - ต้องระวังการ import module วนลูป
3. **Learning Curve** - ผู้เริ่มต้นต้องเรียนรู้โครงสร้างก่อน

---

### คำถามที่ 2
**การแยก Service ออกเป็น 3 ส่วน สอดคล้องกับ Single Responsibility Principle อย่างไร?**

- `RentalsService` - จัดการ CRUD หลักของ rental (create, findAll, updateStatus)
- `RentalValidationService` - ตรวจสอบ overlap และ state machine transitions
- `RentalStockService` - จัดการ stock (checkout/return)

**ประโยชน์:**
- แต่ละ class มีหน้าที่เดียว ชัดเจน
- ง่ายต่อการ test แยกแต่ละส่วน
- สามารถ refactor ได้โดยไม่กระทบส่วนอื่น

**ถ้าไม่แยก:**
- ไฟล์ RentalsService จะมีหลายพันบรรทัด
- ยากต่อการ debug เพราะ logic ปะปนกัน
- การแก้บั๊กอาจกระทบส่วนอื่น (side effects)

---

### คำถามที่ 3
**ทำไมใช้ State Machine Pattern สำหรับ Rental Status?**

**เหตุผล:**
- **ป้องกัน Invalid Transitions** - ไม่อนุญาตให้กระโดดข้ามสถานะ (เช่น PENDING → RETURNED)
- **Data Integrity** - มั่นใจว่าสถานะเปลี่ยนตาม business rules
- **Auditability** - สามารถติดตามได้ว่าผ่านสถานะใดมาบ้าง

**ตัวอย่าง `allowedTransitions`:**
```typescript
const allowedTransitions = {
    PENDING: [APPROVED, REJECTED, CANCELLED],
    APPROVED: [CHECKED_OUT, CANCELLED],
    CHECKED_OUT: [RETURNED],
    RETURNED: [],   // สถานะสุดท้าย
    REJECTED: [],   // สถานะสุดท้าย
    CANCELLED: [],  // สถานะสุดท้าย
};
```

**ถ้าใช้ free-form:**
- User อาจแก้ status ใน request body เป็นอะไรก็ได้
- เกิด inconsistent data (เช่น RETURNED โดยไม่เคย CHECKED_OUT)

---

### คำถามที่ 4
**ความแตกต่างระหว่าง `@Module()`, `@Controller()`, และ `@Injectable()`**

| Decorator | หน้าที่ | ตัวอย่าง |
|-----------|--------|---------|
| `@Module()` | กำหนดโครงสร้าง container รวม imports, providers, controllers | `app.module.ts` |
| `@Controller()` | กำหนด HTTP endpoints (routes) | `rentals.controller.ts` |
| `@Injectable()` | บอกว่า class นี้สามารถ inject เข้า class อื่นได้ | `rentals.service.ts` |

**บทบาทในระบบ:**
- Module เป็น container จัดกลุ่ม feature
- Controller รับ HTTP request และส่งต่อไป Service
- Service ทำ business logic และเข้าถึง database

---

### คำถามที่ 5
**ทำไมใช้ `TypeOrmModule.forRootAsync()` แทน `forRoot()`?**

**`forRoot()`** - ใส่ config ตรงๆ ใน code:
```typescript
TypeOrmModule.forRoot({
    host: 'localhost',
    password: 'hardcoded!', // ❌ ไม่ดี!
})
```

**`forRootAsync()`** - โหลด config จาก ConfigService:
```typescript
TypeOrmModule.forRootAsync({
    inject: [ConfigService],
    useFactory: (config) => ({
        host: config.get('DB_HOST'),
        password: config.get('DB_PASSWORD'), // ✅ จาก .env
    }),
})
```

**ข้อดี:**
1. **Security** - ไม่ hardcode credentials
2. **Flexibility** - เปลี่ยน env ได้โดยไม่แก้ code
3. **Environment-based** - ใช้ config ต่างกันใน dev/staging/production

---

## 2. Authentication & Security

### คำถามที่ 6
**ทำไมใช้ `bcrypt.compare()` แทนการเปรียบเทียบ password โดยตรง?**

**เหตุผล:**
1. **Hashing One-way** - bcrypt hash ไม่สามารถ reverse กลับเป็น password ได้
2. **Salt** - แต่ละ password มี salt ไม่เหมือนกัน แม้ password เดียวกัน hash ต่างกัน
3. **Timing Attack Prevention** - `compare()` ใช้เวลาเท่ากันไม่ว่าจะถูกหรือผิด

**กระบวนการทำงาน:**
1. User สมัคร → password ถูก hash ด้วย `bcrypt.hash()`
2. User login → bcrypt extract salt จาก hash แล้วจึงเปรียบเทียบ

---

### คำถามที่ 7
**ทำไม JWT payload ไม่ใส่ `name` หรือ `password`?**

**Payload ปัจจุบัน:**
```typescript
{ sub: user.id, studentId: user.studentId, role: user.role }
```

**เหตุผลที่ไม่ใส่ password:**
- JWT สามารถ decode ได้โดยไม่ต้องมี secret (Base64)
- ถ้าใส่ password จะเป็นความเสี่ยงด้าน security

**เหตุผลที่ไม่ใส่ name:**
- ลดขนาด token
- `name` ไม่จำเป็นต่อ authorization logic
- ถ้าต้องการ name สามารถ query จาก DB ได้

**หลักการ:** ใส่เฉพาะข้อมูลที่จำเป็นต่อการ authorize

---

### คำถามที่ 8
**ทำไมต้อง exclude password ออกจาก result ใน `validateUser()`?**

```typescript
const { password, ...result } = user;
return result;
```

**เหตุผล:**
1. **Security** - ไม่ return password hash กลับไป frontend
2. **Best Practice** - ข้อมูล sensitive ไม่ควรส่งออกนอก backend
3. **Principle of Least Privilege** - ส่งเฉพาะข้อมูลที่จำเป็น

---

### คำถามที่ 9
**ถ้า JWT token ถูกขโมย ผู้ไม่หวังดีทำอะไรได้บ้าง?**

**สิ่งที่ทำได้:**
- เข้าถึง API ทุก endpoint ที่ user นั้นมีสิทธิ์
- สร้างคำขอยืมในนามของ user
- ดูประวัติการยืมของ user

**มาตรการป้องกัน:**
1. **Short Expiration** - ให้ token หมดอายุเร็ว (เช่น 15 นาที)
2. **Refresh Token** - ใช้ refresh token แยกเพื่อต่ออายุ
3. **Token Blacklist** - เก็บ list token ที่ถูก revoke
4. **HTTPS Only** - ป้องกัน man-in-the-middle
5. **Device Binding** - ผูก token กับ device fingerprint

---

### คำถามที่ 10
**ThrottlerModule ช่วยป้องกันการโจมตีประเภทใดบ้าง?**

```typescript
ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])
// 100 requests ต่อ 60 วินาที ต่อ IP
```

**ป้องกัน:**
1. **Brute Force Attack** - พยายาม login หลายๆ ครั้ง
2. **DDoS Attack** - ส่ง request จำนวนมากเพื่อล่ม server
3. **Credential Stuffing** - ทดลอง username/password หลายชุด
4. **API Abuse** - ดึงข้อมูลมากเกินไป

---

### คำถามที่ 11
**ทำไมใช้ `studentId` เป็นตัว login แทน email?**

**ข้อดี:**
1. **Unique Identifier** - รหัสนักศึกษาไม่ซ้ำกันแน่นอน
2. **Easy to Remember** - นักศึกษาจำรหัสตัวเองได้
3. **Verification** - ยืนยันตัวตนได้ง่ายกว่า email
4. **Institutional Context** - เหมาะกับระบบในสถานศึกษา

**ข้อเสีย:**
1. **Privacy** - รหัสนักศึกษาอาจถูก guess ได้ (sequential)
2. **Limited Scope** - ใช้ได้เฉพาะนักศึกษาปัจจุบัน
3. **No Recovery** - ถ้าลืมรหัสนักศึกษา recover ยาก

---

## 3. Database Design & TypeORM

### คำถามที่ 12
**ทำไมใช้ UUID แทน auto-increment integer เป็น Primary Key?**

**ข้อดีของ UUID:**
1. **Globally Unique** - ไม่ซ้ำกันข้าม databases
2. **Security** - ไม่สามารถ guess ID ได้ (ต่างจาก id=1, id=2...)
3. **Merge Friendly** - รวม data จากหลาย sources ได้โดยไม่ conflict
4. **Distributed Systems** - สร้าง ID ที่ client ได้เลย

**ข้อเสีย:**
1. **Storage** - ใช้ 16 bytes (vs 4 bytes ของ int)
2. **Performance** - INSERT ช้ากว่าเล็กน้อย (random, not sequential)
3. **Readability** - อ่านยากกว่า integer

---

### คำถามที่ 13
**`cascade` และ `eager` ใน `@OneToMany` ทำหน้าที่อะไร?**

```typescript
@OneToMany(() => EquipmentItem, (item) => item.equipment, { cascade: true, eager: true })
items: EquipmentItem[];
```

**`cascade: true`:**
- เมื่อ save/remove Equipment จะทำกับ Items ด้วยอัตโนมัติ
- ไม่ต้องเรียก `itemRepository.save()` แยก

**`eager: true`:**
- เมื่อ query Equipment จะ load items มาด้วยโดยอัตโนมัติ
- ไม่ต้องระบุ `relations: ['items']`

**ผลต่อ Performance:**
- **ข้อดี:** ลด boilerplate code, ข้อมูลครบในครั้งเดียว
- **ข้อเสีย:** ถ้ามี items เยอะ query จะช้า (N+1 problem potential)

---

### คำถามที่ 14
**ทำไมใช้ `SET NULL` แทน `CASCADE` สำหรับ EquipmentItem ใน Rental?**

```typescript
@ManyToOne(() => EquipmentItem, { nullable: true, onDelete: 'SET NULL' })
```

**เหตุผล:**
- **Data Preservation** - ถ้าลบ EquipmentItem ยังคงเก็บประวัติการยืมไว้
- **Audit Trail** - สำคัญสำหรับการตรวจสอบย้อนหลัง
- **Business Logic** - การยืมเคยเกิดขึ้นจริง ไม่ควรหายไป

**ถ้าใช้ CASCADE:**
- ลบ EquipmentItem → ลบ Rental ทั้งหมดที่เกี่ยวข้อง
- สูญเสียประวัติการยืม ไม่เหมาะกับ audit requirements

---

### คำถามที่ 15
**ทำไม `synchronize: true` ไม่ควรใช้ใน Production?**

**อันตราย:**
1. **Data Loss** - อาจลบ column/table ที่ไม่มีใน entity
2. **Schema Changes** - เปลี่ยน schema โดยไม่ตั้งใจ
3. **No Rollback** - ไม่สามารถย้อนกลับได้

**ทางเลือกที่ควรใช้:**
- **Migrations** - ใช้ `npm run migration:run`
- สร้าง migration files ที่ version controlled
- สามารถ rollback ได้ (`migration:revert`)

---

### คำถามที่ 16
**ทำไม `AuditLog` เก็บ `username` ซ้ำกับการมี relation ไปยัง User?**

```typescript
@Column()
userId: string;

@Column()
username: string; // <- Denormalization
```

**เหตุผล (Denormalization):**
1. **Historical Accuracy** - ถ้า user เปลี่ยนชื่อ log เก่ายังคงแสดงชื่อ ณ ขณะนั้น
2. **Performance** - ไม่ต้อง JOIN กับ users table ทุกครั้ง
3. **Orphan Protection** - ถ้าลบ user log ยังคงมีชื่อ

**Trade-off:**
- ใช้ storage มากขึ้น
- ต้อง update ทุกครั้งที่ชื่อเปลี่ยน (ถ้าต้องการ)

---

### คำถามที่ 17
**ข้อดีของการใช้ PostgreSQL enum เทียบกับ varchar?**

```typescript
@Column({ type: 'enum', enum: RentalStatus })
status: RentalStatus;
```

**ข้อดี:**
1. **Data Integrity** - database บังคับให้ใส่ค่าที่ valid เท่านั้น
2. **Storage Efficient** - เก็บเป็น integer ภายใน
3. **Type Safety** - IDE บอก error ถ้าใส่ค่าผิด

**ข้อเสีย:**
- เพิ่ม/ลบ enum value ต้องทำ migration
- บาง ORM ไม่รองรับ enum ดี

---

### คำถามที่ 18
**หลักการตรรกศาสตร์ของ overlap detection**

```sql
rental.startDate < :endDate AND rental.endDate > :startDate
```

**กรณีที่เป็นไปได้:**
1. **A อยู่ก่อน B หมด** → A.end ≤ B.start → ไม่ซ้อน
2. **A อยู่หลัง B หมด** → A.start ≥ B.end → ไม่ซ้อน
3. **ทุกกรณีอื่น** → ซ้อนทับกัน

**ดังนั้น:** ซ้อน ⟺ NOT (A.end ≤ B.start OR A.start ≥ B.end)
             ⟺ A.end > B.start AND A.start < B.end

| Case | A (10-15) | B (12-18) | ซ้อน? |
|------|-----------|-----------|-------|
| เงื่อนไข | 10 < 18 ✓ | 15 > 12 ✓ | ซ้อน! |

---

## 4. Business Logic - Rental System

### คำถามที่ 19
**ทำไมต้องใช้ `>=` แทน `>` ใน `if (start >= end)`?**

**ถ้าใช้ `>` เท่านั้น:**
- start = 2024-01-10 10:00, end = 2024-01-10 10:00 → จะผ่าน!
- แต่ช่วงเวลาเป็น 0 วินาที ไม่ make sense

**ใช้ `>=`:**
- ป้องกันกรณี start = end (ช่วงเวลา 0)
- ยืนยันว่า endDate ต้องมาหลัง startDate เสมอ

---

### คำถามที่ 20
**Use case ของ `allowOverlap` flag**

**กรณีที่ต้องยอมให้ overlap:**
1. **Wishlist Feature** - User ต้องการ "ลงชื่อรอ" แม้จะมีคนจองแล้ว
2. **Waitlist** - ระบบใช้เป็น list สำหรับพิจารณา
3. **Different Items** - Equipment เดียวกันมีหลาย items

**ข้อดี:**
- Flexibility สำหรับ user
- รองรับ use case ที่ซับซ้อน

**ข้อเสีย:**
- Admin ต้องจัดการ overlapping requests manually
- อาจทำให้ user สับสนว่าจะได้หรือไม่

---

### คำถามที่ 21
**ทำไม `handleDuplicateRequests()` ยกเลิกคำขอเก่าอัตโนมัติ?**

**เหตุผล:**
1. **UX ดีกว่า** - User ไม่ต้องไปยกเลิกเอง
2. **ลด Clutter** - ไม่มี requests ซ้ำๆ ใน admin queue
3. **Intent ชัดเจน** - request ใหม่คือสิ่งที่ user ต้องการจริง

**ถ้า throw error:**
- User ต้อง navigate ไปหน้าประวัติ → หา request → กดยกเลิก → กลับมาส่งใหม่
- ประสบการณ์ใช้งานแย่

---

### คำถามที่ 22
**ทำไมต้อง auto-reject rental อื่นที่ overlap?**

**เหตุผล:**
- **Physical Constraint** - อุปกรณ์มีชิ้นเดียว ให้คนเดียวใช้ได้
- **Prevent Double Booking** - หลีกเลี่ยงความสับสน
- **Admin Workload** - ไม่ต้อง manually reject ทีละ request

**ถ้าไม่ทำ:**
- Admin อนุมัติ A แล้ว ต้องไป reject B, C, D เอง
- อาจลืม → เกิด conflict ตอน checkout

---

### คำถามที่ 23
**ทำไมต้อง check ทั้ง `other.id === rental.id` และ `other.status !== PENDING`?**

```typescript
if (other.id === rental.id || other.status !== RentalStatus.PENDING) continue;
```

**`other.id === rental.id`:**
- ไม่ให้ reject ตัวเอง (rental ที่กำลัง approve)

**`other.status !== PENDING`:**
- Reject เฉพาะ PENDING เท่านั้น
- ไม่ควร reject APPROVED/CHECKED_OUT (เพราะอนุมัติไปแล้ว)

---

### คำถามที่ 24
**ทำไม return `autoRejectedRentals` ด้วย?**

```typescript
return { ...savedRental, autoRejectedRentals: rejectedNames };
```

**ประโยชน์ UX:**
1. **Transparency** - Admin รู้ว่ามีคำขออื่นถูก reject ไปด้วย
2. **Audit** - บันทึกว่ามีผลกระทบต่อใครบ้าง
3. **Notification** - Frontend สามารถแสดงข้อความแจ้ง users ที่ถูก reject

---

### คำถามที่ 25
**Flow ทั้งหมดตั้งแต่ user สร้างคำขอจนได้รับอนุมัติ:**

1. **User สร้างคำขอ** (`POST /rentals`)
   - ตรวจสอบวันที่ (start < end, ไม่ใช่อดีต)
   - ตรวจสอบ equipment item availability
   - ยกเลิก duplicate requests อัตโนมัติ
   - ตรวจสอบ overlap (ถ้า allowOverlap=false)
   - บันทึก Rental ใหม่ status=PENDING
   - บันทึก AuditLog (RENTAL_CREATE)

2. **Admin อนุมัติ** (`PATCH /rentals/:id/status`)
   - ตรวจสอบ state transition (PENDING → APPROVED ถูกต้อง)
   - Auto-reject overlapping PENDING requests
   - เปลี่ยน status เป็น APPROVED
   - บันทึก AuditLog (RENTAL_STATUS_APPROVED)

3. **User มารับอุปกรณ์** (`PATCH /rentals/:id/status` → CHECKED_OUT)
   - อัพเดท EquipmentItem status = RENTED
   - ลด Equipment.stockQty -= 1
   - ถ้า stockQty = 0 → Equipment.status = UNAVAILABLE

---

### คำถามที่ 26
**ถ้า User A (10-15) และ User B (12-18) แล้ว Admin อนุมัติ A?**

1. Admin เปลี่ยน status ของ A เป็น `APPROVED`
2. `handleAutoRejection()` ถูกเรียก
3. หา overlapping rentals: พบ B (12-18 ซ้อนกับ 10-15)
4. B.status เปลี่ยนเป็น `REJECTED`
5. บันทึก AuditLog: `RENTAL_AUTO_REJECTED` สำหรับ B
6. Return: `{ ...rental, autoRejectedRentals: ['User B (studentId)'] }`

---

### คำถามที่ 27
**ทำไม CHECKED_OUT ไม่สามารถเปลี่ยนเป็น CANCELLED?**

**เหตุผลทาง Business:**
1. **อุปกรณ์อยู่กับ user แล้ว** - การยกเลิกไม่ make sense
2. **Stock ถูกลดไปแล้ว** - ต้อง return ก่อน ไม่ใช่ cancel
3. **Accountability** - ต้องมีหลักฐานว่าคืนแล้ว
4. **Process Integrity** - ต้องผ่านขั้นตอนคืนตามปกติ

**ถ้าอนุญาต CANCELLED:**
- Stock ไม่กลับคืน (logical error)
- ไม่มีหลักฐานว่าอุปกรณ์อยู่ที่ไหน

---

## 5. Stock & Inventory Management

### คำถามที่ 28
**ข้อดีของ Two-Level Inventory (Equipment + EquipmentItem)**

| เก็บแบบเดียว | Two-Level |
|-------------|-----------|
| Equipment มี stockQty=5 | Equipment + 5 EquipmentItem records |
| ไม่รู้ว่าชิ้นไหนถูกยืม | รู้ว่า item 001 ถูกยืม, 002 available |
| ไม่สามารถติดตามชิ้นงาน | สามารถ track แต่ละชิ้นได้ |

**ข้อดี:**
1. **Individual Tracking** - รู้ว่ากล้องตัวไหนอยู่กับใคร
2. **Condition Logging** - บันทึกสภาพแต่ละชิ้น
3. **Audit Trail** - ประวัติการยืมแต่ละชิ้น
4. **Serial Number Tracking** - จัดการ asset ได้ละเอียด

---

### คำถามที่ 29
**เมื่อสร้าง Equipment ใหม่ที่มี stockQty = 5?**

- สร้าง **5 EquipmentItem records**
- `itemCode`: "001", "002", "003", "004", "005"
- ทุก item มี status = AVAILABLE

```typescript
for (let i = 1; i <= stockQty; i++) {
    itemCode: String(i).padStart(3, '0'), // "001", "002"...
}
```

---

### คำถามที่ 30
**ทำไมต้อง check stock อีกครั้งใน `handleCheckout()`?**

**เหตุผล:**
1. **Race Condition** - อาจมี request อื่นผ่านไปก่อน
2. **Time Gap** - ระหว่าง APPROVED → CHECKED_OUT อาจมี admin แก้ stock
3. **Defense in Depth** - multiple layers of validation

**ตัวอย่าง:**
- 9:00 - Rental A approved (stock=1)
- 9:01 - Rental B approved (stock=1, แต่ A ยังไม่ checkout)
- 9:02 - Rental A checkout (stock=0)
- 9:03 - Rental B checkout → ต้องเจอ error "out of stock!"

---

### คำถามที่ 31
**เมื่อไหร่ Equipment กลับเป็น AVAILABLE?**

ใน `handleReturn()`:
```typescript
if (equipment.stockQty > 0 && equipment.status === EquipmentStatus.UNAVAILABLE) {
    equipment.status = EquipmentStatus.AVAILABLE;
}
```

**เงื่อนไข:**
1. stockQty เพิ่มขึ้นหลัง return (stockQty > 0)
2. สถานะปัจจุบันเป็น UNAVAILABLE

---

### คำถามที่ 32
**ถ้า Admin เพิ่ม stockQty จาก 3 เป็น 5?**

```typescript
if (newStockQty > oldStockQty) {
    const currentMaxCode = Math.max(...items.map(i => parseInt(i.itemCode)));
    // currentMaxCode = 3
    for (let i = currentMaxCode + 1; i <= currentMaxCode + (newStockQty - oldStockQty); i++) {
        // i = 4, 5
        itemCode = String(i).padStart(3, '0'); // "004", "005"
    }
}
```

**ผลลัพธ์:**
- สร้าง EquipmentItem "004" และ "005"
- ต่อเนื่องจาก item ที่มีอยู่

---

### คำถามที่ 33
**Race condition ใน `handleCheckout()` ทำให้ stock ติดลบได้หรือไม่?**

**ใช่ มีความเสี่ยง!**

**Scenario:**
1. Request A: อ่าน stockQty = 1
2. Request B: อ่าน stockQty = 1
3. Request A: stockQty = 1 - 1 = 0, save
4. Request B: stockQty = 1 - 1 = 0, save
5. Stock ไม่ติดลบ แต่ยืมไป 2 ชิ้นแทนที่จะเป็น 1!

**วิธีแก้:**
1. **Database Transaction with Locking:**
```typescript
await queryRunner.manager
    .createQueryBuilder()
    .setLock("pessimistic_write")
    .where("id = :id", { id: equipmentId })
    .getOne();
```

2. **Optimistic Locking:**
```typescript
@VersionColumn()
version: number;
```

3. **Atomic Update:**
```sql
UPDATE equipments SET stockQty = stockQty - 1 
WHERE id = :id AND stockQty > 0
```

---

## 6. Audit Logging System

### คำถามที่ 34
**ทำไมต้องมี Audit Logging?**

**Accountability:**
- รู้ว่าใครทำอะไร เมื่อไหร่
- ป้องกันการปฏิเสธความรับผิดชอบ
- หลักฐานสำหรับกรณีพิพาท

**Debugging:**
- ติดตามลำดับเหตุการณ์ได้
- หา root cause ของ bug
- เข้าใจ state ของระบบ ณ เวลาหนึ่ง

---

### คำถามที่ 35
**ทำไมไม่ใช้ JSONB column ของ PostgreSQL?**

**ปัจจุบัน:** `@Column({ type: 'text' }) details: string;`

**ข้อดีของ text:**
- เรียบง่าย ไม่ต้อง parse
- Compatible กับทุก database
- TypeORM handle ได้โดยไม่ต้อง config เพิ่ม

**ข้อดีของ JSONB:**
- Query ภายใน JSON ได้ (`details->>'reason' = 'overlap'`)
- Index ได้
- Validate structure at database level

**ข้อเสียของ JSONB:**
- PostgreSQL specific
- ต้อง migrate ถ้าเปลี่ยน structure

---

### คำถามที่ 36
**ทำไมแยก AUTO_CANCELLED และ AUTO_REJECTED?**

| Action | Trigger | เหตุผล |
|--------|---------|-------|
| `RENTAL_CANCELLED` | User ยกเลิกเอง | ตั้งใจยกเลิก |
| `RENTAL_AUTO_CANCELLED` | User ส่ง request ใหม่ซ้อน | ถูกแทนที่ |
| `RENTAL_REJECTED` | Admin reject | พิจารณาแล้วไม่อนุมัติ |
| `RENTAL_AUTO_REJECTED` | มีคนอื่นได้ approval ก่อน | Conflict resolution |

**ประโยชน์:**
- วิเคราะห์ได้ว่าคน cancel เองกี่ครั้ง vs ถูก auto กี่ครั้ง
- Debug ได้ว่าทำไม rental ถูก reject

---

### คำถามที่ 37
**`deleteOlderThan(days)` มีไว้ทำอะไร?**

```typescript
async deleteOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    // DELETE WHERE createdAt < cutoffDate
}
```

**Log Retention Policy:**
1. **Storage Management** - ลบ log เก่าที่ไม่จำเป็น
2. **Performance** - ลดขนาด table ให้ query เร็วขึ้น
3. **Compliance** - บางกฎหมายกำหนดระยะเวลาเก็บ data
4. **Privacy** - ลบข้อมูลที่ไม่จำเป็นต้องเก็บ

---

### คำถามที่ 38
**หา audit trail ของ rental หนึ่งรายการ?**

```typescript
// Query
await auditLogRepository.find({
    where: { rentalId: 'xxx-xxx-xxx' },
    order: { createdAt: 'ASC' },
    relations: ['user'],
});
```

**ผลลัพธ์:**
```json
[
    { "actionType": "RENTAL_CREATE", "username": "John", "createdAt": "10:00" },
    { "actionType": "RENTAL_STATUS_APPROVED", "username": "Admin", "createdAt": "11:00" },
    { "actionType": "RENTAL_STATUS_CHECKED_OUT", "username": "Admin", "createdAt": "14:00" },
    { "actionType": "RENTAL_STATUS_RETURNED", "username": "Admin", "createdAt": "18:00" }
]
```

---

## 7. Error Handling & Validation

### คำถามที่ 39
**`whitelist` และ `forbidNonWhitelisted` ทำอะไร?**

```typescript
new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
})
```

**`whitelist: true`:**
- ลบ properties ที่ไม่ได้ประกาศใน DTO ออก
- ป้องกัน Mass Assignment Attack

**`forbidNonWhitelisted: true`:**
- ถ้ามี property ไม่รู้จัก → throw error
- บอก user ว่าส่ง data ผิด

**ตัวอย่าง:**
```typescript
// DTO มีแค่ name, password
{ name: "John", password: "123", role: "ADMIN" } // ❌ Error! role ไม่อนุญาต
```

---

### คำถามที่ 40
**ทำไม `transform: true` สำคัญ?**

**ปัญหาถ้าไม่มี:**
```typescript
@IsDate()
startDate: Date; // Body: "2024-01-15" → string ไม่ใช่ Date!
```

**`transform: true`:**
- แปลง string → Date อัตโนมัติ
- แปลง "123" → 123 (number)
- ใช้ `class-transformer` เบื้องหลัง

---

### คำถามที่ 41
**ทำไม throw `NotFoundException` แทน return null?**

**return null:**
```typescript
const rental = await findOne(id);
if (!rental) { /* ต้อง check ทุกที่ที่เรียก */ }
```

**throw exception:**
```typescript
if (!rental) throw new NotFoundException(`Rental ${id} not found`);
```

**ข้อดี:**
1. **Fail Fast** - รู้ทันทีว่ามีปัญหา
2. **Centralized Handling** - Exception Filter จัดการที่เดียว
3. **Proper HTTP Status** - ได้ 404 อัตโนมัติ
4. **Less Boilerplate** - ไม่ต้อง check null ทุกที่

---

### คำถามที่ 42
**ความแตกต่างระหว่าง Exceptions:**

| Exception | HTTP Status | ใช้เมื่อ |
|-----------|-------------|---------|
| `BadRequestException` | 400 | Request ไม่ถูกต้อง (validation fail, logic ผิด) |
| `NotFoundException` | 404 | Resource ไม่พบ (wrong ID) |
| `UnauthorizedException` | 401 | ไม่มีสิทธิ์/ไม่ได้ login |

**ตัวอย่าง:**
- 400: "End date must be after start date"
- 404: "Rental with ID xxx not found"
- 401: "No token provided" หรือ "Invalid credentials"

---

### คำถามที่ 43
**`HttpExceptionFilter` ทำหน้าที่อะไร?**

**หน้าที่:**
- จับทุก exception ที่ throw จาก application
- จัดรูปแบบ response ให้เหมือนกันทุก endpoint

**ทำไมต้องเหมือนกัน:**
1. **Client Consistency** - Frontend parse response ได้ง่าย
2. **Documentation** - API spec ชัดเจน
3. **Logging** - Log format เดียวกัน

**ตัวอย่าง Format:**
```json
{
    "statusCode": 400,
    "message": "End date must be after start date",
    "error": "Bad Request",
    "timestamp": "2024-01-15T10:00:00.000Z"
}
```

---

## 8. Performance & Scalability

### คำถามที่ 44
**ปัญหาถ้ามี rentals 10,000 records?**

```typescript
return this.rentalRepository.find({
    relations: ['user', 'equipment', 'equipmentItem'],
});
```

**ปัญหา:**
1. **Memory** - โหลดทั้ง 10,000 records + relations ลง RAM
2. **Network** - ส่ง data ขนาดใหญ่ให้ client
3. **Time** - JOIN หลาย tables ช้า

**วิธีแก้:**
1. **Pagination:**
```typescript
.skip((page - 1) * limit)
.take(limit)
```

2. **Select เฉพาะ fields:**
```typescript
.select(['rental.id', 'rental.status', 'user.name'])
```

3. **Lazy Loading:** โหลด relations เมื่อต้องการ

---

### คำถามที่ 45
**ควรมี index บน column ใดบ้างสำหรับ overlap query?**

```typescript
.where('rental.equipmentId = :equipmentId')
.andWhere('rental.startDate < :endDate')
.andWhere('rental.endDate > :startDate')
```

**Index ที่ควรมี:**
1. `equipmentId` - filter ตัวหลัก
2. Composite: `(equipmentId, startDate, endDate)` - ครอบคลุมทั้ง query
3. `status` - ที่ใช้ filter excluded statuses

```sql
CREATE INDEX idx_rental_overlap 
ON rentals (equipmentId, startDate, endDate);
```

---

### คำถามที่ 46
**เมื่อไหร่ควร/ไม่ควรใช้ `eager: true`?**

**ควรใช้:**
- Relation ที่ต้องการเสมอ (Equipment → Items)
- ขนาดเล็ก (1-10 records)
- ใช้บ่อย

**ไม่ควรใช้:**
- Relation ที่มี records เยอะ
- ใช้แค่บาง endpoints
- Circular relations

---

### คำถามที่ 47
**จุดอ่อนถ้ารองรับ 1,000 concurrent users?**

1. **Single Database** - เป็น bottleneck
2. **No Connection Pooling** - connection หมด
3. **Race Conditions** - stock management
4. **No Caching** - query ซ้ำๆ
5. **Synchronous Operations** - blocking

**วิธีแก้:**
- Database connection pool
- Redis caching
- Load balancer + multiple instances
- Message queue สำหรับ heavy tasks

---

### คำถามที่ 48
**ทำไม sort ที่ database ดีกว่า application?**

```typescript
.orderBy('rental.startDate', 'ASC')
```

**Database Level:**
- ใช้ index ได้
- ส่งมาแค่ top N (ถ้ามี LIMIT)
- ไม่ต้องโหลดทั้งหมดลง memory

**Application Level:**
```typescript
rentals.sort((a, b) => a.startDate - b.startDate);
```
- ต้องโหลดทั้งหมดก่อน
- ใช้ RAM เยอะ
- ช้ากว่ามาก

---

## 9. Code Quality & Best Practices

### คำถามที่ 49
**ทำไม Service ไม่ควร access `Request` object โดยตรง?**

**ปัญหา:**
```typescript
// ❌ ไม่ดี
class RentalsService {
    create(@Req() req: Request) {
        const userId = req.user.id;
    }
}
```

**ที่ถูกต้อง:**
```typescript
// ✅ ดี
class RentalsService {
    create(userId: string, dto: CreateRentalDto) { }
}
```

**เหตุผล:**
1. **Testability** - test ง่ายกว่า ไม่ต้อง mock Request
2. **Reusability** - เรียก service จากที่อื่นได้ (cron, CLI)
3. **Separation of Concerns** - Service ไม่ควรรู้ว่าถูกเรียกผ่าน HTTP

---

### คำถามที่ 50
**ทำไมต้อง inject `AuditLogsService` แทนการ import ตรง?**

**Import ตรง (ไม่ดี):**
```typescript
import { log } from './audit-logs.service';
log(...); // Static function
```

**Inject (ดี):**
```typescript
constructor(private auditLogsService: AuditLogsService) {}
```

**เหตุผล:**
1. **Testability** - mock ได้ง่าย
2. **Loose Coupling** - เปลี่ยน implementation ได้โดยไม่แก้ code
3. **Lifecycle Management** - NestJS จัดการ instance ให้
4. **Dependency Graph** - รู้ว่า class ไหน depend กับอะไร

---

### คำถามที่ 51
**ประโยชน์ของ Dependency Injection ใน NestJS**

**ประโยชน์:**
1. **Loose Coupling** - classes ไม่ผูกกันแน่น
2. **Testability** - inject mock ได้
3. **Single Instance** - Singleton by default
4. **Centralized Configuration** - กำหนดที่ module

**เมื่อประกาศ `@Injectable()`:**
- Class ถูก register ใน NestJS IoC Container
- สามารถ inject เข้า class อื่นได้
- NestJS สร้าง instance ให้อัตโนมัติ

---

### คำถามที่ 52
**ทำไมแยก DTO สำหรับ Create และ Update?**

**`CreateRentalDto`:**
```typescript
@IsNotEmpty()
equipmentId: string;
@IsNotEmpty()
startDate: string;
```

**`UpdateRentalStatusDto`:**
```typescript
@IsEnum(RentalStatus)
status: RentalStatus;
@IsOptional()
rejectReason?: string;
```

**เหตุผล:**
1. **Different Required Fields** - create ต้องมี equipmentId, update ไม่ต้อง
2. **Validation Rules** - แต่ละ operation ต้องการ validation ต่างกัน
3. **Security** - ป้องกันการ update fields ที่ไม่ควร update

---

### คำถามที่ 53
**Destructuring `const { password, ...result } = user;` ทำอะไร?**

**ทำหน้าที่:**
- แยก `password` ออกจาก object
- `result` มีทุก properties ยกเว้น password

**วิธีอื่น:**
```typescript
// 1. delete keyword
const result = { ...user };
delete result.password;

// 2. Explicit mapping
const result = {
    id: user.id,
    name: user.name,
    role: user.role,
};

// 3. class-transformer @Exclude()
@Exclude()
password: string;
```

---

### คำถามที่ 54
**ทำไม enum ถูก define ทั้ง TypeScript และ database?**

**TypeScript:**
```typescript
export enum RentalStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
}
```

**Database (PostgreSQL):**
```sql
CREATE TYPE rental_status AS ENUM ('PENDING', 'APPROVED', ...);
```

**ถ้าไม่ sync:**
- TypeScript มี `WAITING` แต่ DB ไม่มี → INSERT fail
- DB มี `EXPIRED` แต่ TypeScript ไม่มี → query result มี unknown value

**Best Practice:** ใช้ migrations เพื่อ sync enum changes

---

## 10. Testing & Debugging

### คำถามที่ 55
**Unit Test สำหรับ `handleAutoRejection()` ควร mock อะไร?**

**ควร Mock:**
1. `rentalRepository` - return fake overlapping rentals
2. `auditLogsService.log()` - บันทึก mock call

**Test Cases:**
1. มี overlapping PENDING → ถูก reject
2. ไม่มี overlapping → ไม่มีการ reject
3. overlapping แต่เป็น APPROVED → ไม่ถูก reject
4. overlapping เป็น rental ตัวเอง → ไม่ถูก reject
5. มีหลาย overlapping → reject ทุกตัว

---

### คำถามที่ 56
**ถ้าต้อง debug rental creation ควรเพิ่ม log อะไร?**

```typescript
this.logger.log(`Creating rental for user ${userId}, equipment ${equipmentId}`);
this.logger.log(`Date range: ${startDate} - ${endDate}`);
this.logger.log(`allowOverlap: ${allowOverlap}`);
this.logger.log(`Duplicate check result: ${duplicates.length} found`);
this.logger.log(`Overlap check result: ${hasOverlap}`);
this.logger.log(`Rental created with ID: ${rental.id}`);
```

---

### คำถามที่ 57
**Debug "ส่งคำขอยืมแล้วหายไป" ทำอย่างไร?**

**ดูใน Audit Log:**
```typescript
const logs = await auditLogsService.findByUser(userId);
// หา RENTAL_CREATE, RENTAL_AUTO_CANCELLED
```

**กรณีที่เป็นไปได้:**
1. `RENTAL_AUTO_CANCELLED` - ถูกแทนที่ด้วย request ใหม่
2. ไม่มี log เลย - API call fail ตั้งแต่ต้น
3. `RENTAL_AUTO_REJECTED` - มีคนอื่นได้ approve ก่อน

---

### คำถามที่ 58
**Integration Test สำหรับ full flow ต้องเตรียมอะไร?**

**Test Data:**
1. **User** - สร้าง test user (role: USER และ ADMIN)
2. **Equipment** - สร้าง test equipment พร้อม items
3. **Clean State** - ลบ test rentals ก่อนและหลัง test

**Test Steps:**
```typescript
describe('Full Rental Flow', () => {
    it('create → approve → checkout → return', async () => {
        // 1. Create rental as USER
        const rental = await rentalsService.create(userId, createDto);
        expect(rental.status).toBe(PENDING);

        // 2. Approve as ADMIN
        await rentalsService.updateStatus(rental.id, { status: APPROVED });
        
        // 3. Checkout
        await rentalsService.updateStatus(rental.id, { status: CHECKED_OUT });
        // Assert: equipment.stockQty decreased
        
        // 4. Return
        await rentalsService.updateStatus(rental.id, { status: RETURNED });
        // Assert: equipment.stockQty restored
    });
});
```

---

## 🎯 คำถามสังเคราะห์ขั้นสูง

### คำถามที่ 59
**เพิ่มฟีเจอร์ "จองล่วงหน้าได้ไม่เกิน 30 วัน"**

**แก้ไข:**
1. `CreateRentalDto` - เพิ่ม custom validator
2. `RentalsService.create()` - เพิ่ม validation

```typescript
// ใน create()
const today = new Date();
const maxFutureDate = new Date();
maxFutureDate.setDate(today.getDate() + 30);

if (start > maxFutureDate) {
    throw new BadRequestException('Cannot book more than 30 days in advance');
}
```

---

### คำถามที่ 60
**รองรับหลายสาขา (branches)**

**Database Schema Changes:**
```typescript
@Entity('branches')
class Branch {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column()
    name: string;
}

// Equipment เพิ่ม
@ManyToOne(() => Branch)
branch: Branch;

// User เพิ่ม (optional - ถ้าต้องการ)
@ManyToOne(() => Branch)
defaultBranch: Branch;
```

**Query Changes:**
```typescript
.where('equipment.branchId = :branchId', { branchId })
```

---

### คำถามที่ 61
**เพิ่มระบบ Notification**

**Layer:** Event-driven ใน Service layer

**Pattern:** Observer/Event Emitter

```typescript
// rentals.service.ts
if (newStatus === RentalStatus.APPROVED) {
    this.eventEmitter.emit('rental.approved', { rental, userId });
}

// notification.listener.ts
@OnEvent('rental.approved')
async handleApproval(event: RentalApprovedEvent) {
    await this.notificationService.send(
        event.userId,
        'Your rental has been approved!'
    );
}
```

---

### คำถามที่ 62
**Scale ระบบเป็น Multi-tenant (หลายมหาวิทยาลัย)**

**Approaches:**

1. **Separate Databases:**
   - แต่ละมหาวิทยาลัยมี DB ของตัวเอง
   - ปลอดภัยที่สุด แต่ manage ยาก

2. **Schema per tenant:**
   - PostgreSQL schemas: `university_a.rentals`, `university_b.rentals`
   - กลางๆ ระหว่าง isolation และ complexity

3. **Shared Database with tenant_id:**
   ```typescript
   @Column()
   tenantId: string;
   
   // ทุก query เพิ่ม
   .where('tenantId = :tenantId')
   ```

**เพิ่มเติม:**
- Tenant context middleware
- Subdomain routing (a.rentals.com, b.rentals.com)
- Centralized authentication

---

### คำถามที่ 63
**เพิ่มฟีเจอร์ "ยืมต่อ" (Extend Rental)**

**Fields ใหม่:**
```typescript
@Column({ default: false })
isExtended: boolean;

@Column({ nullable: true })
originalEndDate: Date;

@Column({ default: 0 })
extensionCount: number;
```

**Business Logic:**
```typescript
async extendRental(id: string, newEndDate: Date): Promise<Rental> {
    const rental = await this.findOne(id);
    
    // Validations
    if (rental.status !== RentalStatus.CHECKED_OUT) {
        throw new BadRequestException('Can only extend active rentals');
    }
    if (rental.extensionCount >= 1) {
        throw new BadRequestException('Can only extend once');
    }
    
    // Check overlap with new dates
    const hasOverlap = await this.validationService.checkOverlap(
        rental.equipmentId,
        rental.endDate,
        newEndDate,
        rental.id
    );
    if (hasOverlap) {
        throw new BadRequestException('Extension period conflicts with another booking');
    }
    
    rental.originalEndDate = rental.endDate;
    rental.endDate = newEndDate;
    rental.isExtended = true;
    rental.extensionCount += 1;
    
    return this.rentalRepository.save(rental);
}
```

---

### คำถามที่ 64
**จุดอ่อนด้าน Data Integrity**

**ปัญหา:**
1. **No Transaction:** หลาย operations ไม่ wrap ใน transaction
   - `handleAutoRejection` + `save rental` + `save stock` → ถ้า fail กลางทาง?

2. **Race Conditions:** Stock update ไม่มี locking

3. **Partial Failures:** Log อาจสำเร็จแต่ rental fail

**Solution:**
```typescript
async updateStatus(id: string, dto: UpdateRentalStatusDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    
    try {
        // All operations here
        await queryRunner.commitTransaction();
    } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
    } finally {
        await queryRunner.release();
    }
}
```

---

### คำถามที่ 65
**Implement Soft Delete สำหรับ Equipment**

**Changes:**

1. **Entity:**
```typescript
@DeleteDateColumn()
deletedAt: Date;
```

2. **Service:**
```typescript
// remove() เปลี่ยนเป็น
async softRemove(id: string) {
    await this.equipmentRepository.softDelete(id);
}
```

3. **Queries:**
```typescript
// TypeORM จะ exclude deleted records อัตโนมัติ
// ถ้าต้องการรวม deleted:
.withDeleted()
```

4. **Relations:**
```typescript
// Rental ที่อ้างถึง deleted equipment
// ยังคงเห็น equipment ได้ (historical data)
.leftJoinAndSelect('rental.equipment', 'equipment')
.withDeleted()
```

**ผลกระทบ:**
- Stock calculations ต้องไม่รวม deleted
- Admin UI ต้องมีตัวเลือกดู deleted items
- Restore functionality ต้องตรวจสอบ itemCode conflicts

---

*เอกสารนี้สร้างเมื่อ: January 2026*
