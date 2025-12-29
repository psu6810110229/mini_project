import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

// Defining Role here for simplicity and safety
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  studentId: string;  // Changed from email to studentId

  @Column()
  password: string;

  @Column({ nullable: true })
  name: string;       // Changed from firstName/lastName to single name

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @UpdateDateColumn()
  updatedAt: Date;
}