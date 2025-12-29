import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn } from 'typeorm';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') // Defined as UUID (String)
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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}