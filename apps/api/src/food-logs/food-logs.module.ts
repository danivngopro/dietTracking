import { Module } from '@nestjs/common';
import { FoodsModule } from '../foods/foods.module';
import { MealsModule } from '../meals/meals.module';
import { FoodLogsController } from './food-logs.controller';
import { FoodLogsService } from './food-logs.service';
import { LogSnapshotService } from './log-snapshot.service';
@Module({ imports: [FoodsModule, MealsModule], controllers: [FoodLogsController], providers: [FoodLogsService, LogSnapshotService], exports: [FoodLogsService] })
export class FoodLogsModule {}
