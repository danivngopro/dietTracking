import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { MacroValues } from '@diet/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { FoodsService } from '../foods/foods.service';
import { MealsService } from '../meals/meals.service';
import { multiplyMacros, serializeDecimal, sumMacros } from '../domain/macros/macro-calculator';
import { CreateMealPlanDto, PlanItemDto, UpdateMealPlanDto } from './meal-plan.dto';

const include = { items: { include: { food: true, meal: { include: { items: { include: { food: true } } } }, log: { select: { id: true } } } } } as const;
@Injectable()
export class MealPlansService {
  constructor(private readonly prisma: PrismaService, private readonly foods: FoodsService, private readonly meals: MealsService) {}
  private validateXor(items: PlanItemDto[]) { for (const item of items) if (Boolean(item.foodId) === Boolean(item.mealId)) throw new ConflictException({ code: 'INVALID_PLAN_ITEM_SOURCE', message: 'Each plan item must reference either a food or a meal, not both' }); }
  private async ensureSources(userId: string, items: PlanItemDto[]) { await Promise.all(items.map((item) => item.foodId ? this.foods.findVisible(userId, item.foodId) : this.meals.getOwned(userId, item.mealId!))); }
  private macrosForItem(item: any): MacroValues { if (item.food) return multiplyMacros({ calories: serializeDecimal(item.food.calories), protein: serializeDecimal(item.food.protein), carbs: serializeDecimal(item.food.carbs), fat: serializeDecimal(item.food.fat) }, item.quantity); const meal = this.meals.map(item.meal); return multiplyMacros(meal, item.quantity); }
  map(plan: any) { const items = plan.items.map((item: any) => ({ id: item.id, foodId: item.foodId, mealId: item.mealId, sourceName: item.food?.name ?? item.meal?.name, quantity: serializeDecimal(item.quantity), plannedTime: item.plannedTime, mealLabel: item.mealLabel, notes: item.notes, isEaten: Boolean(item.log), ...this.macrosForItem(item) })); return { id: plan.id, name: plan.name, date: new Date(plan.date).toISOString().slice(0, 10), items, ...sumMacros(items) }; }
  async list(userId: string) { return (await this.prisma.mealPlan.findMany({ where: { userId }, include, orderBy: { date: 'desc' } })).map((plan) => this.map(plan)); }
  async getOwned(userId: string, id: string) { const plan = await this.prisma.mealPlan.findFirst({ where: { id, userId }, include }); if (!plan) throw new NotFoundException({ code: 'PLAN_NOT_FOUND', message: 'Plan not found' }); return plan; }
  async get(userId: string, id: string) { return this.map(await this.getOwned(userId, id)); }
  async forDate(userId: string, date: string) { const plan = await this.prisma.mealPlan.findUnique({ where: { userId_date: { userId, date: new Date(`${date}T00:00:00.000Z`) } }, include }); return plan ? this.map(plan) : null; }
  async create(userId: string, dto: CreateMealPlanDto) { this.validateXor(dto.items); await this.ensureSources(userId, dto.items); try { return this.map(await this.prisma.mealPlan.create({ data: { userId, name: dto.name, date: new Date(`${dto.date}T00:00:00.000Z`), items: { create: dto.items } }, include })); } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException({ code: 'PLAN_ALREADY_EXISTS', message: 'A plan already exists for this date' }); throw error; } }
  async update(userId: string, id: string, dto: UpdateMealPlanDto) { await this.getOwned(userId, id); this.validateXor(dto.items); await this.ensureSources(userId, dto.items); const plan = await this.prisma.$transaction(async (tx) => { await tx.mealPlanItem.deleteMany({ where: { mealPlanId: id, log: null } }); if (await tx.mealPlanItem.count({ where: { mealPlanId: id } })) throw new ConflictException({ code: 'PLAN_HAS_EATEN_ITEMS', message: 'Remove linked logs before replacing this plan' }); return tx.mealPlan.update({ where: { id }, data: { name: dto.name, date: new Date(`${dto.date}T00:00:00.000Z`), items: { create: dto.items } }, include }); }); return this.map(plan); }
  async remove(userId: string, id: string) { await this.getOwned(userId, id); if (await this.prisma.foodLog.count({ where: { mealPlanItem: { mealPlanId: id } } })) throw new ConflictException({ code: 'PLAN_HAS_EATEN_ITEMS', message: 'Delete linked logs before deleting this plan' }); await this.prisma.mealPlan.delete({ where: { id } }); return { deleted: true }; }
}

