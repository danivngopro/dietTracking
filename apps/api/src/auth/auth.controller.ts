import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { CurrentUser, type AuthUser } from './current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const cookieName = () => process.env.AUTH_COOKIE_NAME ?? 'diet_session';
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: process.env.COOKIE_MAX_AGE_MS ? Number(process.env.COOKIE_MAX_AGE_MS) : SEVEN_DAYS_MS,
  ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
});

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('signup') async signup(@Body() dto: SignupDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.signup(dto.email, dto.password);
    response.cookie(cookieName(), result.token, cookieOptions());
    return result.user;
  }
  @Post('login') async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.login(dto.email, dto.password);
    response.cookie(cookieName(), result.token, cookieOptions());
    return result.user;
  }
  @Post('logout') logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(cookieName(), cookieOptions());
    return { loggedOut: true };
  }
  @Get('me') @UseGuards(JwtAuthGuard) me(@CurrentUser() user: AuthUser) { return user; }
}

