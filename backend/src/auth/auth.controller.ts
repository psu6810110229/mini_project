import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';   // Swagger documentation
import { AuthService } from './auth.service';                            // Auth business logic
import { UsersService } from '../users/users.service';                   // User CRUD
import { CreateUserDto } from '../users/dto/create-user.dto';            // DTO สำหรับสมัคร
import { LoginDto } from './dto/login.dto';                              // DTO สำหรับ login
import { Public } from './decorators/public.decorator';                  // ข้าม JWT check

@ApiTags('Auth')                                                         // จัดกลุ่มใน Swagger
@Controller('auth')                                                      // Route: /api/auth
export class AuthController {
  constructor(
    private readonly authService: AuthService,                          // Inject AuthService
    private readonly usersService: UsersService,                        // Inject UsersService
  ) { }

  // POST /api/auth/register - สมัครสมาชิกใหม่
  @Public()                                                              // ไม่ต้อง login ก่อน
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })                     // คำอธิบายใน Swagger
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Student ID already exists' })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);                     // สร้าง user ใหม่
  }

  // POST /api/auth/login - เข้าสู่ระบบ
  @Public()                                                              // ไม่ต้อง login ก่อน
  @Post('login')
  @HttpCode(HttpStatus.OK)                                              // Return 200 แทน 201
  @ApiOperation({ summary: 'Login with Student ID and Password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    // 1. ตรวจสอบ studentId กับ password
    const user = await this.authService.validateUser(
      loginDto.studentId,
      loginDto.password,
    );

    // 2. ถ้าไม่ถูกต้อง → 401 Unauthorized
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. ถ้าถูกต้อง → สร้าง JWT token และส่งกลับ
    return this.authService.login(user);
  }
}