import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { PrismaService } from '../database/prisma.service';
import { JWT_SECRET } from '../config/jwt.config';

const cookieExtractor = (request: Request) => request?.cookies?.[process.env.AUTH_COOKIE_NAME ?? 'diet_session'] ?? null;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({ jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]), secretOrKey: JWT_SECRET });
  }
  async validate(payload: { sub: string }) {
    return this.prisma.user.findUniqueOrThrow({ where: { id: payload.sub }, select: { id: true, email: true, timezone: true } });
  }
}

