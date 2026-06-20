import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
@Controller('dashboard') @UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}
  @Get() get(@CurrentUser() user: AuthUser, @Query('date') date: string) { return this.dashboard.get(user.id, date, user.timezone); }
}

