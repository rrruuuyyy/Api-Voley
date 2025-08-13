import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForgotPassword } from './entities/forgot-password.entity';
import { Usuario } from '../user/entities/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, ForgotPassword]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'MyUltraSecurePassWordIWontForgetToChange',
      signOptions: { expiresIn: '365d' },
    }),
    // MailModule
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [
    JwtStrategy, AuthService,
  ]
})
export class AuthModule {}
