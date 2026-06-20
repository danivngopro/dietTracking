import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { FoodLogsService } from './food-logs.service';

const mockSnapshot = {
  calories: '165',
  protein: '31',
  carbs: '0',
  fat: '3.6',
  sourceName: 'Chicken breast',
  servingDescription: '100 gram',
};

const snapshotService = { build: jest.fn().mockResolvedValue(mockSnapshot) } as any;

function makePlanItem(overrides: object = {}) {
  return {
    id: 'item-1',
    foodId: 'food-1',
    mealId: null,
    quantity: new Decimal('1'),
    notes: null,
    mealPlan: { userId: 'user-1' },
    ...overrides,
  };
}

function makeLog(overrides: object = {}) {
  return {
    id: 'log-1',
    foodId: 'food-1',
    mealId: null,
    mealPlanItemId: 'item-1',
    quantity: new Decimal('1'),
    eatenAt: new Date('2026-06-20T12:00:00Z'),
    caloriesSnapshot: new Decimal('165'),
    proteinSnapshot: new Decimal('31'),
    carbsSnapshot: new Decimal('0'),
    fatSnapshot: new Decimal('3.6'),
    sourceNameSnapshot: 'Chicken breast',
    servingDescriptionSnapshot: '100 gram',
    notes: null,
    ...overrides,
  };
}

describe('FoodLogsService.markEaten', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws PLAN_ITEM_NOT_FOUND when item does not belong to user', async () => {
    const prisma = { mealPlanItem: { findFirst: jest.fn().mockResolvedValue(null) } } as any;
    const service = new FoodLogsService(prisma, snapshotService);

    const error: ConflictException = await service.markEaten('user-1', 'item-1', {}).catch((e) => e);
    expect(error).toBeInstanceOf(NotFoundException);
    expect((error.getResponse() as any).code).toBe('PLAN_ITEM_NOT_FOUND');
  });

  it('creates a log and returns serialized result', async () => {
    const log = makeLog();
    const prisma = {
      mealPlanItem: { findFirst: jest.fn().mockResolvedValue(makePlanItem()) },
      $transaction: jest.fn().mockImplementation((cb: any) =>
        cb({ foodLog: { create: jest.fn().mockResolvedValue(log) } }),
      ),
    } as any;
    const service = new FoodLogsService(prisma, snapshotService);

    const result = await service.markEaten('user-1', 'item-1', {});
    expect(result.id).toBe('log-1');
    expect(result.mealPlanItemId).toBe('item-1');
    expect(result.calories).toBe('165');
  });

  it('throws PLAN_ITEM_ALREADY_LOGGED on P2002 unique constraint violation', async () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint failed on mealPlanItemId', {
      code: 'P2002',
      clientVersion: '6.0.0',
      meta: { target: ['mealPlanItemId'] },
      batchRequestIdx: 0,
    });
    const prisma = {
      mealPlanItem: { findFirst: jest.fn().mockResolvedValue(makePlanItem()) },
      $transaction: jest.fn().mockRejectedValue(p2002),
    } as any;
    const service = new FoodLogsService(prisma, snapshotService);

    const error = await service.markEaten('user-1', 'item-1', {}).catch((e) => e);
    expect(error).toBeInstanceOf(ConflictException);
    expect((error.getResponse() as any).code).toBe('PLAN_ITEM_ALREADY_LOGGED');
  });

  it('re-throws unexpected errors unchanged', async () => {
    const unexpected = new Error('DB connection lost');
    const prisma = {
      mealPlanItem: { findFirst: jest.fn().mockResolvedValue(makePlanItem()) },
      $transaction: jest.fn().mockRejectedValue(unexpected),
    } as any;
    const service = new FoodLogsService(prisma, snapshotService);

    await expect(service.markEaten('user-1', 'item-1', {})).rejects.toBe(unexpected);
  });
});

describe('FoodLogsService.update snapshot recalculation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rebuilds the snapshot from the edited source on update', async () => {
    const existingLog = makeLog();
    const updatedLog = makeLog({ caloriesSnapshot: new Decimal('330'), proteinSnapshot: new Decimal('62') });
    const updatedSnapshot = { ...mockSnapshot, calories: '330', protein: '62' };
    const buildMock = jest.fn().mockResolvedValue(updatedSnapshot);
    const snapshots = { build: buildMock } as any;

    const prisma = {
      foodLog: {
        findFirst: jest.fn().mockResolvedValue(existingLog),
        update: jest.fn().mockResolvedValue(updatedLog),
      },
    } as any;
    const service = new FoodLogsService(prisma, snapshots);

    const result = await service.update('user-1', 'log-1', {
      foodId: 'food-1',
      quantity: '2',
      eatenAt: '2026-06-20T12:00:00Z',
    });

    expect(buildMock).toHaveBeenCalledWith('user-1', expect.objectContaining({ foodId: 'food-1', quantity: '2' }));
    expect(result.calories).toBe('330');
  });
});
