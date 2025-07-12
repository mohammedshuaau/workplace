import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ZodValidationPipe } from 'nestjs-zod';
import { APP_PIPE } from '@nestjs/core';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthController } from './auth.controller';
import { JWT_SECRET } from '../../env';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: JWT_SECRET as string,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy, 
    JwtAuthGuard, 
    RolesGuard,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
  exports: [JwtAuthGuard, RolesGuard],
})
export class AuthModule {} 