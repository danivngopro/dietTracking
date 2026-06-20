import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import type { MacroValues } from '@diet/shared';
import { FoodLogsService } from '../food-logs/food-logs.service';
import { MealPlansService } from '../meal-plans/meal-plans.service';
import { serializeDecimal, sumMacros } from '../domain/macros/macro-calculator';
import { TargetsService } from '../targets/targets.service';
@Injectable()
export class DashboardService {
  constructor(private readonly logs: FoodLogsService, private readonly plans: MealPlansService, private readonly targets: TargetsService) {}
  async get(userId: string, date: string, timezone: string) {
    const [logs, plan, targets] = await Promise.all([this.logs.list(userId, date, timezone), this.plans.forDate(userId, date), this.targets.get(userId)]);
    const actual = sumMacros(logs);
    const remaining: MacroValues | null = targets ? {
      calories: serializeDecimal(new Decimal(targets.calories).minus(actual.calories)),
      protein: serializeDecimal(new Decimal(targets.protein).minus(actual.protein)),
      carbs: serializeDecimal(new Decimal(targets.carbs).minus(actual.carbs)),
      fat: serializeDecimal(new Decimal(targets.fat).minus(actual.fat)),
    } : null;
    return { date, targets, actual, remaining, plan, logs };
  }
}

