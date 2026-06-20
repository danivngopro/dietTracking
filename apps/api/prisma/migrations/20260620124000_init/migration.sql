CREATE TYPE "FoodSource" AS ENUM ('SYSTEM', 'USER');
CREATE TYPE "ServingUnit" AS ENUM ('GRAM', 'MILLILITER', 'PIECE', 'SCOOP');
CREATE TYPE "MealLabel" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'OTHER');

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Jerusalem',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "MacroTarget" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "calories" DECIMAL(12,3) NOT NULL,
  "protein" DECIMAL(12,3) NOT NULL,
  "carbs" DECIMAL(12,3) NOT NULL,
  "fat" DECIMAL(12,3) NOT NULL,
  "currentWeight" DECIMAL(12,3),
  "goalWeight" DECIMAL(12,3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MacroTarget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Food" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT UNIQUE,
  "userId" TEXT,
  "source" "FoodSource" NOT NULL,
  "name" TEXT NOT NULL,
  "brand" TEXT,
  "servingSize" DECIMAL(12,3) NOT NULL,
  "servingUnit" "ServingUnit" NOT NULL,
  "calories" DECIMAL(12,3) NOT NULL,
  "protein" DECIMAL(12,3) NOT NULL,
  "carbs" DECIMAL(12,3) NOT NULL,
  "fat" DECIMAL(12,3) NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Food_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Food_source_owner_check" CHECK (("source" = 'SYSTEM' AND "userId" IS NULL) OR ("source" = 'USER' AND "userId" IS NOT NULL)),
  CONSTRAINT "Food_nonnegative_check" CHECK ("servingSize" > 0 AND "calories" >= 0 AND "protein" >= 0 AND "carbs" >= 0 AND "fat" >= 0)
);
CREATE INDEX "Food_userId_name_idx" ON "Food"("userId", "name");
CREATE INDEX "Food_source_name_idx" ON "Food"("source", "name");

CREATE TABLE "Meal" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Meal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Meal_userId_name_idx" ON "Meal"("userId", "name");

CREATE TABLE "MealItem" (
  "id" TEXT PRIMARY KEY,
  "mealId" TEXT NOT NULL,
  "foodId" TEXT NOT NULL,
  "quantity" DECIMAL(12,3) NOT NULL CHECK ("quantity" > 0),
  CONSTRAINT "MealItem_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MealItem_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "MealItem_foodId_idx" ON "MealItem"("foodId");

CREATE TABLE "MealPlan" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MealPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MealPlan_userId_date_key" UNIQUE ("userId", "date")
);
CREATE INDEX "MealPlan_userId_date_idx" ON "MealPlan"("userId", "date");

CREATE TABLE "MealPlanItem" (
  "id" TEXT PRIMARY KEY,
  "mealPlanId" TEXT NOT NULL,
  "foodId" TEXT,
  "mealId" TEXT,
  "quantity" DECIMAL(12,3) NOT NULL CHECK ("quantity" > 0),
  "plannedTime" TEXT,
  "mealLabel" "MealLabel",
  "notes" TEXT,
  CONSTRAINT "MealPlanItem_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MealPlanItem_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MealPlanItem_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MealPlanItem_source_xor_check" CHECK (("foodId" IS NOT NULL)::int + ("mealId" IS NOT NULL)::int = 1)
);
CREATE INDEX "MealPlanItem_foodId_idx" ON "MealPlanItem"("foodId");
CREATE INDEX "MealPlanItem_mealId_idx" ON "MealPlanItem"("mealId");

CREATE TABLE "FoodLog" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "foodId" TEXT,
  "mealId" TEXT,
  "mealPlanItemId" TEXT UNIQUE,
  "quantity" DECIMAL(12,3) NOT NULL CHECK ("quantity" > 0),
  "eatenAt" TIMESTAMPTZ(3) NOT NULL,
  "caloriesSnapshot" DECIMAL(12,3) NOT NULL,
  "proteinSnapshot" DECIMAL(12,3) NOT NULL,
  "carbsSnapshot" DECIMAL(12,3) NOT NULL,
  "fatSnapshot" DECIMAL(12,3) NOT NULL,
  "sourceNameSnapshot" TEXT NOT NULL,
  "servingDescriptionSnapshot" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FoodLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "FoodLog_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "FoodLog_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "FoodLog_mealPlanItemId_fkey" FOREIGN KEY ("mealPlanItemId") REFERENCES "MealPlanItem"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "FoodLog_source_xor_check" CHECK (("foodId" IS NOT NULL)::int + ("mealId" IS NOT NULL)::int = 1)
);
CREATE INDEX "FoodLog_userId_eatenAt_idx" ON "FoodLog"("userId", "eatenAt");
CREATE INDEX "FoodLog_foodId_idx" ON "FoodLog"("foodId");
CREATE INDEX "FoodLog_mealId_idx" ON "FoodLog"("mealId");
