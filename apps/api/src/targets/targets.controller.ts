import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpsertTargetDto } from './target.dto';
import { TargetsService } from './targets.service';
@Controller('targets') @UseGuards(JwtAuthGuard)
export class TargetsController {
  constructor(private readonly targets: TargetsService) {}
  @Get() get(@CurrentUser() user: AuthUser) { return this.targets.get(user.id); }
  @Put() upsert(@CurrentUser() user: AuthUser, @Body() dto: UpsertTargetDto) { return this.targets.upsert(user.id, dto); }
}

