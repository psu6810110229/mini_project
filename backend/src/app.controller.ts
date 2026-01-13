import { Controller, Get } from '@nestjs/common';                       // NestJS decorators
import { Public } from './auth/decorators/public.decorator';            // ข้าม JWT check

@Controller()                                                            // Controller ที่ root path (/)
export class AppController {
  @Public()                                                              // ไม่ต้อง login ก็เข้าได้
  @Get()                                                                 // GET /api
  getHello(): string {
    return 'System Online. Ready for orders.';                          // Health check response
  }
}