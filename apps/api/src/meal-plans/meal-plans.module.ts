import { Module } from '@nestjs/common';
import { FoodsModule } from '../foods/foods.module';
import { MealsModule } from '../meals/meals.module';
import { MealPlansController } from './meal-plans.controller';
import { MealPlansService } from './meal-plans.service';
@Module({ imports: [FoodsModule, MealsModule], controllers: [MealPlansController], providers: [MealPlansService], exports: [MealPlansService] })
export class MealPlansModule {}
