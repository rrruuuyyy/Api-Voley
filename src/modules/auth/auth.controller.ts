import { Controller, Get, Post, Body, Req, UseGuards, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import * as requestInterface from 'src/core/interfaces/request.interface';
import { ForgotDto } from './dto/forgot.dto';
import { ResetDto } from './dto/reset.dto';
import { LoginSucursalDto } from './dto/login-sucursalo.dto';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(200)
  @Post('login')
  login(@Body() loginAuthDto: LoginAuthDto) {
    return this.authService.login(loginAuthDto);
  }

  @HttpCode(200)
  @Post('login-sucursal')
  loginSucursal(@Body() loginAuthDto: LoginSucursalDto) {
    return this.authService.loginSucursal(loginAuthDto);
  }

  @Post('register')
  registerUser(@Body() createAuthDto: RegisterAuthDto) {
    return this.authService.register(createAuthDto);
  }

  @Post('forgot')
  forgot(@Body() {email}: ForgotDto) {
    return this.authService.forgot({email});
  }

  @Post('reset')
  reset(@Body() payload: ResetDto) {
    return this.authService.reset(payload);
  }

  @Get('refresh')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  check(@Req() { user }: requestInterface.ExtendedRequest) {
    return this.authService.refresh(user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() { user }: requestInterface.ExtendedRequest) {
    return this.authService.me(user);
  }
  
}
