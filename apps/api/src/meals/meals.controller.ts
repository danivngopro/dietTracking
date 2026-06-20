import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateMealDto, UpdateMealDto } from './meal.dto';
import { MealsService } from './meals.service';
@Controller('meals') @UseGuards(JwtAuthGuard)
export class MealsController {
  constructor(private readonly meals: MealsService) {}
  @Get() list(@CurrentUser() user: AuthUser) { return this.meals.list(user.id); }
  @Get(':id') get(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.meals.get(user.id, id); }
  @Post() create(@CurrentUser() user: AuthUser, @Body() dto: CreateMealDto) { return this.meals.create(user.id, dto); }
  @Patch(':id') update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateMealDto) { return this.meals.update(user.id, id, dto); }
  @Delete(':id') remove(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.meals.remove(user.id, id); }
  @Post(':id/duplicate') duplicate(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.meals.duplicate(user.id, id); }
}

