import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  CreateDateColumn
} from 'typeorm';

// Enum สำหรับ role ของผู้ใช้
export enum UserRole {
  ADMIN = 'ADMIN',                                                       // ผู้ดูแลระบบ
  USER = 'USER',                                                         // ผู้ใช้ทั่วไป
}

@Entity('users')                                                         // ตาราง: users
export class User {
  @PrimaryGeneratedColumn('uuid')                                        // Primary Key แบบ UUID
  id: string;                                                            // รหัสผู้ใช้

  @Column({ unique: true, nullable: true })                              // ห้ามซ้ำ
  studentId: string;                                                     // รหัสนักศึกษา (ใช้ login)

  @Column()
  password: string;                                                      // รหัสผ่าน (bcrypt hash)

  @Column({ nullable: true })
  name: string;                                                          // ชื่อผู้ใช้

  @Column({
    type: 'enum',                                                        // PostgreSQL enum
    enum: UserRole,
    default: UserRole.USER,                                              // ค่าเริ่มต้น = USER
  })
  role: UserRole;                                                        // ADMIN หรือ USER

  @CreateDateColumn()                                                    // บันทึกอัตโนมัติตอนสร้าง
  createdAt: Date;

  @UpdateDateColumn()                                                    // บันทึกอัตโนมัติตอนอัปเดต
  updatedAt: Date;
}