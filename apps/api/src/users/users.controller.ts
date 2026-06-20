import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../database/prisma.service';
import { isValidZone } from '../common/time/local-day';
import { DomainException } from '../common/errors/domain.exception';
import { UpdateProfileDto } from './update-profile.dto';

@Controller('me') @UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}
  @Patch() async update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    if (!isValidZone(dto.timezone)) throw new DomainException('INVALID_TIMEZONE', 'Timezone is not supported');
    return this.prisma.user.update({ where: { id: user.id }, data: { timezone: dto.timezone }, select: { id: true, email: true, timezone: true } });
  }
}

