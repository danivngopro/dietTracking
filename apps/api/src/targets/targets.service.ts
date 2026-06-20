import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { serializeDecimal } from '../domain/macros/macro-calculator';
import { UpsertTargetDto } from './target.dto';
@Injectable()
export class TargetsService {
  constructor(private readonly prisma: PrismaService) {}
  map(target: any) { return target ? { calories: serializeDecimal(target.calories), protein: serializeDecimal(target.protein), carbs: serializeDecimal(target.carbs), fat: serializeDecimal(target.fat), currentWeight: target.currentWeight ? serializeDecimal(target.currentWeight) : null, goalWeight: target.goalWeight ? serializeDecimal(target.goalWeight) : null, notes: target.notes } : null; }
  async get(userId: string) { return this.map(await this.prisma.macroTarget.findUnique({ where: { userId } })); }
  async upsert(userId: string, dto: UpsertTargetDto) { return this.map(await this.prisma.macroTarget.upsert({ where: { userId }, update: dto, create: { userId, ...dto } })); }
}

