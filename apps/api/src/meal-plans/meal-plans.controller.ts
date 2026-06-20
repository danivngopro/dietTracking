import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateMealPlanDto, UpdateMealPlanDto } from './meal-plan.dto';
import { MealPlansService } from './meal-plans.service';
@Controller('plans') @UseGuards(JwtAuthGuard)
export class MealPlansController {
  constructor(private readonly plans: MealPlansService) {}
  @Get() list(@CurrentUser() user: AuthUser) { return this.plans.list(user.id); }
  @Get(':id') get(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.plans.get(user.id, id); }
  @Post() create(@CurrentUser() user: AuthUser, @Body() dto: CreateMealPlanDto) { return this.plans.create(user.id, dto); }
  @Patch(':id') update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateMealPlanDto) { return this.plans.update(user.id, id, dto); }
  @Delete(':id') remove(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.plans.remove(user.id, id); }
}

