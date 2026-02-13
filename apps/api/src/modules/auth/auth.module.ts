import { Module, Global } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ClerkAuthGuard } from '../../common/guards';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    // Apply ClerkAuthGuard globally - use @Public() decorator to skip
    {
      provide: APP_GUARD,
      useClass: ClerkAuthGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
