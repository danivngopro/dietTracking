import { ConflictException, Injectable } from '@nestjs/common';
import { FoodsService } from '../foods/foods.service';
import { MealsService } from '../meals/meals.service';
import { multiplyMacros, serializeDecimal } from '../domain/macros/macro-calculator';
@Injectable()
export class LogSnapshotService {
  constructor(private readonly foods: FoodsService, private readonly meals: MealsService) {}
  async build(userId: string, source: { foodId?: string; mealId?: string; quantity: string }) {
    if (Boolean(source.foodId) === Boolean(source.mealId)) throw new ConflictException({ code: 'INVALID_LOG_SOURCE', message: 'A log must reference either a food or a meal, not both' });
    if (source.foodId) { const food = await this.foods.findVisible(userId, source.foodId); return { ...multiplyMacros({ calories: serializeDecimal(food.calories), protein: serializeDecimal(food.protein), carbs: serializeDecimal(food.carbs), fat: serializeDecimal(food.fat) }, source.quantity), sourceName: food.name, servingDescription: `${serializeDecimal(food.servingSize)} ${food.servingUnit.toLowerCase()}` }; }
    const meal = this.meals.map(await this.meals.getOwned(userId, source.mealId!));
    return { ...multiplyMacros(meal, source.quantity), sourceName: meal.name, servingDescription: 'meal' };
  }
}

