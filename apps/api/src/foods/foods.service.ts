import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { FoodSource, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { serializeDecimal } from '../domain/macros/macro-calculator';
import { CreateFoodDto, SearchFoodDto, UpdateFoodDto } from './food.dto';

@Injectable()
export class FoodsService {
  constructor(private readonly prisma: PrismaService) {}
  private visible(userId: string): Prisma.FoodWhereInput { return { OR: [{ source: FoodSource.SYSTEM }, { userId }] }; }
  map(food: any) { return { ...food, servingSize: serializeDecimal(food.servingSize), calories: serializeDecimal(food.calories), protein: serializeDecimal(food.protein), carbs: serializeDecimal(food.carbs), fat: serializeDecimal(food.fat), canEdit: food.source === FoodSource.USER }; }
  async list(userId: string, query: SearchFoodDto) {
    const foods = await this.prisma.food.findMany({ where: { AND: [this.visible(userId), query.source ? { source: query.source } : {}, query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' } }, { brand: { contains: query.search, mode: 'insensitive' } }] } : {}] }, orderBy: { name: 'asc' }, take: 50 });
    return foods.map((food) => this.map(food));
  }
  async findVisible(userId: string, id: string) {
    const food = await this.prisma.food.findFirst({ where: { id, AND: [this.visible(userId)] } });
    if (!food) throw new NotFoundException({ code: 'FOOD_NOT_FOUND', message: 'Food not found' });
    return food;
  }
  async create(userId: string, dto: CreateFoodDto) { return this.map(await this.prisma.food.create({ data: { ...dto, source: FoodSource.USER, userId } })); }
  async update(userId: string, id: string, dto: UpdateFoodDto) {
    const food = await this.findVisible(userId, id);
    if (food.source === FoodSource.SYSTEM || food.userId !== userId) throw new ForbiddenException({ code: 'SYSTEM_FOOD_READ_ONLY', message: 'System foods cannot be edited' });
    return this.map(await this.prisma.food.update({ where: { id }, data: dto }));
  }
  async duplicate(userId: string, id: string) {
    const food = await this.findVisible(userId, id);
    if (food.source !== FoodSource.SYSTEM) throw new ConflictException({ code: 'NOT_SYSTEM_FOOD', message: 'Only system foods can be duplicated' });
    return this.map(await this.prisma.food.create({ data: { userId, source: FoodSource.USER, name: food.name, brand: food.brand, servingSize: food.servingSize, servingUnit: food.servingUnit, calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat, notes: food.notes } }));
  }
  async remove(userId: string, id: string) {
    const food = await this.findVisible(userId, id);
    if (food.source === FoodSource.SYSTEM || food.userId !== userId) throw new ForbiddenException({ code: 'SYSTEM_FOOD_READ_ONLY', message: 'System foods cannot be deleted' });
    const dependencies = await this.prisma.$transaction([this.prisma.mealItem.count({ where: { foodId: id } }), this.prisma.mealPlanItem.count({ where: { foodId: id } }), this.prisma.foodLog.count({ where: { foodId: id } })]);
    if (dependencies.some(Boolean)) throw new ConflictException({ code: 'FOOD_IN_USE', message: 'This food is used in existing meals, plans, or logs. Remove those references before deleting.' });
    await this.prisma.food.delete({ where: { id } }); return { deleted: true };
  }
}

