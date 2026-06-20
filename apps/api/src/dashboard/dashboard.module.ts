import { Module } from '@nestjs/common';
import { FoodLogsModule } from '../food-logs/food-logs.module';
import { MealPlansModule } from '../meal-plans/meal-plans.module';
import { TargetsModule } from '../targets/targets.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
@Module({ imports: [FoodLogsModule, MealPlansModule, TargetsModule], controllers: [DashboardController], providers: [DashboardService] })
export class DashboardModule {}

