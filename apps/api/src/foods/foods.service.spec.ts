import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { FoodSource } from '@prisma/client';
import { FoodsService } from './foods.service';

function makeFood(overrides: object = {}) {
  return {
    id: 'food-1',
    slug: null,
    userId: 'user-1',
    source: FoodSource.USER,
    name: 'My Chicken',
    brand: null,
    servingSize: '100',
    servingUnit: 'GRAM',
    calories: '165',
    protein: '31',
    carbs: '0',
    fat: '3.6',
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('FoodsService ownership isolation', () => {
  describe('findVisible', () => {
    it('throws NotFoundException when food does not belong to user and is not SYSTEM', async () => {
      const prisma = { food: { findFirst: jest.fn().mockResolvedValue(null) } } as any;
      const service = new FoodsService(prisma);

      await expect(service.findVisible('other-user', 'food-1')).rejects.toThrow(NotFoundException);
    });

    it('scopes the query to userId and SYSTEM foods', async () => {
      const prisma = { food: { findFirst: jest.fn().mockResolvedValue(null) } } as any;
      const service = new FoodsService(prisma);

      await service.findVisible('user-1', 'food-1').catch(() => {});

      expect(prisma.food.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'food-1',
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([{ userId: 'user-1' }]),
              }),
            ]),
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('blocks editing a system food', async () => {
      const systemFood = makeFood({ source: FoodSource.SYSTEM, userId: null });
      const prisma = { food: { findFirst: jest.fn().mockResolvedValue(systemFood) } } as any;
      const service = new FoodsService(prisma);

      await expect(
        service.update('user-1', 'food-1', {
          name: 'Edited', servingSize: '100', servingUnit: 'GRAM' as any,
          calories: '165', protein: '31', carbs: '0', fat: '3.6',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('blocks editing another user\'s food', async () => {
      const otherFood = makeFood({ userId: 'other-user' });
      const prisma = { food: { findFirst: jest.fn().mockResolvedValue(otherFood) } } as any;
      const service = new FoodsService(prisma);

      await expect(
        service.update('user-1', 'food-1', {
          name: 'Edited', servingSize: '100', servingUnit: 'GRAM' as any,
          calories: '165', protein: '31', carbs: '0', fat: '3.6',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('blocks deleting a system food', async () => {
      const systemFood = makeFood({ source: FoodSource.SYSTEM, userId: null });
      const prisma = { food: { findFirst: jest.fn().mockResolvedValue(systemFood) } } as any;
      const service = new FoodsService(prisma);

      await expect(service.remove('user-1', 'food-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
