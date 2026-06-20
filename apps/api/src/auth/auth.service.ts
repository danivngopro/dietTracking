import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async signup(emailInput: string, password: string) {
    const email = emailInput.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) throw new ConflictException({ code: 'EMAIL_TAKEN', message: 'An account with this email already exists' });
    const user = await this.prisma.user.create({ data: { email, passwordHash: await argon2.hash(password, { type: argon2.argon2id }) }, select: { id: true, email: true, timezone: true } });
    return { user, token: await this.jwt.signAsync({ sub: user.id }) };
  }

  async login(emailInput: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: emailInput.trim().toLowerCase() } });
    if (!user || !(await argon2.verify(user.passwordHash, password))) throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect' });
    return { user: { id: user.id, email: user.email, timezone: user.timezone }, token: await this.jwt.signAsync({ sub: user.id }) };
  }
}

