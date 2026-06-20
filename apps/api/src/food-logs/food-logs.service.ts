import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { localDayUtcRange } from '../common/time/local-day';
import { serializeDecimal } from '../domain/macros/macro-calculator';
import { CreateFoodLogDto, MarkEatenDto, UpdateFoodLogDto } from './food-log.dto';
import { LogSnapshotService } from './log-snapshot.service';
@Injectable()
export class FoodLogsService {
  constructor(private readonly prisma: PrismaService, private readonly snapshots: LogSnapshotService) {}
  map(log: any) { return { id: log.id, foodId: log.foodId, mealId: log.mealId, mealPlanItemId: log.mealPlanItemId, quantity: serializeDecimal(log.quantity), eatenAt: new Date(log.eatenAt).toISOString(), calories: serializeDecimal(log.caloriesSnapshot), protein: serializeDecimal(log.proteinSnapshot), carbs: serializeDecimal(log.carbsSnapshot), fat: serializeDecimal(log.fatSnapshot), sourceName: log.sourceNameSnapshot, servingDescription: log.servingDescriptionSnapshot, notes: log.notes }; }
  private snapshotData(snapshot: Awaited<ReturnType<LogSnapshotService['build']>>) { return { caloriesSnapshot: snapshot.calories, proteinSnapshot: snapshot.protein, carbsSnapshot: snapshot.carbs, fatSnapshot: snapshot.fat, sourceNameSnapshot: snapshot.sourceName, servingDescriptionSnapshot: snapshot.servingDescription }; }
  async list(userId: string, date: string, timezone: string) { const range = localDayUtcRange(date, timezone); return (await this.prisma.foodLog.findMany({ where: { userId, eatenAt: { gte: range.start, lt: range.end } }, orderBy: { eatenAt: 'asc' } })).map((log) => this.map(log)); }
  async create(userId: string, dto: CreateFoodLogDto) { const snapshot = await this.snapshots.build(userId, dto); return this.map(await this.prisma.foodLog.create({ data: { userId, foodId: dto.foodId, mealId: dto.mealId, quantity: dto.quantity, eatenAt: new Date(dto.eatenAt), notes: dto.notes, ...this.snapshotData(snapshot) } })); }
  async update(userId: string, id: string, dto: UpdateFoodLogDto) { const existing = await this.prisma.foodLog.findFirst({ where: { id, userId } }); if (!existing) throw new NotFoundException({ code: 'LOG_NOT_FOUND', message: 'Log not found' }); const snapshot = await this.snapshots.build(userId, dto); return this.map(await this.prisma.foodLog.update({ where: { id }, data: { foodId: dto.foodId ?? null, mealId: dto.mealId ?? null, quantity: dto.quantity, eatenAt: new Date(dto.eatenAt), notes: dto.notes, ...this.snapshotData(snapshot) } })); }
  async remove(userId: string, id: string) { const result = await this.prisma.foodLog.deleteMany({ where: { id, userId } }); if (!result.count) throw new NotFoundException({ code: 'LOG_NOT_FOUND', message: 'Log not found' }); return { deleted: true }; }
  async markEaten(userId: string, itemId: string, dto: MarkEatenDto) {
    // Build the snapshot outside the transaction (reads food/meal data; no write contention).
    const item = await this.prisma.mealPlanItem.findFirst({ where: { id: itemId, mealPlan: { userId } }, include: { mealPlan: true } });
    if (!item) throw new NotFoundException({ code: 'PLAN_ITEM_NOT_FOUND', message: 'Plan item not found' });
    const quantity = dto.quantity ?? serializeDecimal(item.quantity);
    const eatenAt = dto.eatenAt ?? new Date().toISOString();
    const snapshot = await this.snapshots.build(userId, { foodId: item.foodId ?? undefined, mealId: item.mealId ?? undefined, quantity });
    try {
      return this.map(
        await this.prisma.$transaction((tx) =>
          tx.foodLog.create({
            data: {
              userId,
              foodId: item.foodId,
              mealId: item.mealId,
              mealPlanItemId: item.id,
              quantity,
              eatenAt: new Date(eatenAt),
              notes: dto.notes ?? item.notes,
              ...this.snapshotData(snapshot),
            },
          }),
        ),
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException({ code: 'PLAN_ITEM_ALREADY_LOGGED', message: 'This planned item has already been logged' });
      }
      throw error;
    }
  }
}

