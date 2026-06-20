import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateFoodLogDto, MarkEatenDto, UpdateFoodLogDto } from './food-log.dto';
import { FoodLogsService } from './food-logs.service';
@Controller() @UseGuards(JwtAuthGuard)
export class FoodLogsController {
  constructor(private readonly logs: FoodLogsService) {}
  @Get('logs') list(@CurrentUser() user: AuthUser, @Query('date') date: string) { return this.logs.list(user.id, date, user.timezone); }
  @Post('logs') create(@CurrentUser() user: AuthUser, @Body() dto: CreateFoodLogDto) { return this.logs.create(user.id, dto); }
  @Patch('logs/:id') update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateFoodLogDto) { return this.logs.update(user.id, id, dto); }
  @Delete('logs/:id') remove(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.logs.remove(user.id, id); }
  @Post('plans/items/:id/mark-eaten') mark(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: MarkEatenDto) { return this.logs.markEaten(user.id, id, dto); }
}

