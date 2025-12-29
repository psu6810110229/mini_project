import { IsString, IsNotEmpty, MinLength, Matches, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{10}$/, { message: 'Student ID must be 10 digits' }) // ตรวจสอบรหัสนักศึกษา 10 หลัก
  studentId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole; // ปกติเราจะไม่ส่ง role มาตอน register (ให้เป็น default) แต่ใส่ไว้เผื่อ Admin สร้าง User ครับ
}