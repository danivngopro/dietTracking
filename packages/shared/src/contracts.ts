import type { DecimalString } from './decimal';
import type { FoodSource, MealLabel, ServingUnit } from './enums';

export interface MacroValues {
  calories: DecimalString;
  protein: DecimalString;
  carbs: DecimalString;
  fat: DecimalString;
}

export interface ApiSuccess<T> { data: T; meta?: Record<string, unknown> }
export interface ApiFailure { error: { code: string; message: string; details?: unknown } }

export interface PublicUser {
  id: string;
  email: string;
  timezone: string;
}

export interface Food extends MacroValues {
  id: string;
  source: FoodSource;
  name: string;
  brand: string | null;
  servingSize: DecimalString;
  servingUnit: ServingUnit;
  notes: string | null;
  canEdit: boolean;
}

export interface MealItem {
  id: string;
  food: Food;
  quantity: DecimalString;
}

export interface Meal extends MacroValues {
  id: string;
  name: string;
  description: string | null;
  items: MealItem[];
}

export interface PlanItem extends MacroValues {
  id: string;
  foodId: string | null;
  mealId: string | null;
  sourceName: string;
  quantity: DecimalString;
  plannedTime: string | null;
  mealLabel: MealLabel | null;
  notes: string | null;
  isEaten: boolean;
}

export interface MealPlan extends MacroValues {
  id: string;
  name: string;
  date: string;
  items: PlanItem[];
}

export interface FoodLog extends MacroValues {
  id: string;
  foodId: string | null;
  mealId: string | null;
  mealPlanItemId: string | null;
  quantity: DecimalString;
  eatenAt: string;
  sourceName: string;
  servingDescription: string | null;
  notes: string | null;
}

export interface MacroTarget extends MacroValues {
  currentWeight: DecimalString | null;
  goalWeight: DecimalString | null;
  notes: string | null;
}

export interface Dashboard {
  date: string;
  targets: MacroTarget | null;
  actual: MacroValues;
  remaining: MacroValues | null;
  plan: MealPlan | null;
  logs: FoodLog[];
}

