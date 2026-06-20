import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { AuthModule } from "./auth/auth.module";
import { DatabaseModule } from "./database/database.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { FoodLogsModule } from "./food-logs/food-logs.module";
import { FoodsModule } from "./foods/foods.module";
import { MealPlansModule } from "./meal-plans/meal-plans.module";
import { MealsModule } from "./meals/meals.module";
import { OriginGuard } from "./common/origin/origin.guard";
import { TargetsModule } from "./targets/targets.module";
import { UsersModule } from "./users/users.module";
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    FoodsModule,
    MealsModule,
    MealPlansModule,
    FoodLogsModule,
    TargetsModule,
    DashboardModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: OriginGuard }],
})
export class AppModule {}
