import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { MacroValues } from '@diet/shared';
import { FoodSource } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { multiplyMacros, serializeDecimal, sumMacros } from '../domain/macros/macro-calculator';
import { CreateMealDto, UpdateMealDto } from './meal.dto';

const include = { items: { include: { food: true } } } as const;
@Injectable()
export class MealsService {
  constructor(private readonly prisma: PrismaService) {}
  async ensureFoods(userId: string, ids: string[]) {
    const foods = await this.prisma.food.findMany({ where: { id: { in: ids }, OR: [{ source: FoodSource.SYSTEM }, { userId }] } });
    if (new Set(foods.map((food) => food.id)).size !== new Set(ids).size) throw new NotFoundException({ code: 'FOOD_NOT_FOUND', message: 'One or more foods are unavailable' });
  }
  map(meal: any) {
    const itemMacros: MacroValues[] = meal.items.map((item: any) => multiplyMacros({ calories: serializeDecimal(item.food.calories), protein: serializeDecimal(item.food.protein), carbs: serializeDecimal(item.food.carbs), fat: serializeDecimal(item.food.fat) }, item.quantity));
    const totals = sumMacros(itemMacros);
    return { id: meal.id, name: meal.name, description: meal.description, items: meal.items.map((item: any) => ({ id: item.id, food: { ...item.food, servingSize: serializeDecimal(item.food.servingSize), calories: serializeDecimal(item.food.calories), protein: serializeDecimal(item.food.protein), carbs: serializeDecimal(item.food.carbs), fat: serializeDecimal(item.food.fat), canEdit: item.food.source === FoodSource.USER }, quantity: serializeDecimal(item.quantity) })), ...totals };
  }
  async list(userId: string) { return (await this.prisma.meal.findMany({ where: { userId }, include, orderBy: { name: 'asc' } })).map((meal) => this.map(meal)); }
  async getOwned(userId: string, id: string) { const meal = await this.prisma.meal.findFirst({ where: { id, userId }, include }); if (!meal) throw new NotFoundException({ code: 'MEAL_NOT_FOUND', message: 'Meal not found' }); return meal; }
  async get(userId: string, id: string) { return this.map(await this.getOwned(userId, id)); }
  async create(userId: string, dto: CreateMealDto) {
    await this.ensureFoods(userId, dto.items.map((item) => item.foodId));
    const meal = await this.prisma.$transaction((tx) => tx.meal.create({ data: { userId, name: dto.name, description: dto.description, items: { create: dto.items } }, include }));
    return this.map(meal);
  }
  async update(userId: string, id: string, dto: UpdateMealDto) {
    await this.getOwned(userId, id); await this.ensureFoods(userId, dto.items.map((item) => item.foodId));
    const meal = await this.prisma.$transaction(async (tx) => { await tx.mealItem.deleteMany({ where: { mealId: id } }); return tx.meal.update({ where: { id }, data: { name: dto.name, description: dto.description, items: { create: dto.items } }, include }); });
    return this.map(meal);
  }
  async duplicate(userId: string, id: string) { const source = await this.getOwned(userId, id); return this.create(userId, { name: `${source.name} copy`, description: source.description ?? undefined, items: source.items.map((item) => ({ foodId: item.foodId, quantity: serializeDecimal(item.quantity) })) }); }
  async remove(userId: string, id: string) { await this.getOwned(userId, id); const [plans, logs] = await this.prisma.$transaction([this.prisma.mealPlanItem.count({ where: { mealId: id } }), this.prisma.foodLog.count({ where: { mealId: id } })]); if (plans || logs) throw new ConflictException({ code: 'MEAL_IN_USE', message: 'This meal is used in existing plans or logs. Remove those references before deleting.' }); await this.prisma.meal.delete({ where: { id } }); return { deleted: true }; }
}

