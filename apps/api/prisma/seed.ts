import { FoodSource, PrismaClient, ServingUnit } from '@prisma/client';

const prisma = new PrismaClient();

const foods = [
  ['chicken-breast', 'Chicken breast', '100', ServingUnit.GRAM, '165', '31', '0', '3.6'],
  ['cooked-white-rice', 'Cooked white rice', '100', ServingUnit.GRAM, '130', '2.7', '28', '0.3'],
  ['large-egg', 'Egg, large', '1', ServingUnit.PIECE, '72', '6.3', '0.4', '5'],
  ['cottage-cheese-5', 'Cottage cheese 5%', '100', ServingUnit.GRAM, '100', '11', '3', '5'],
  ['tahini', 'Tahini', '100', ServingUnit.GRAM, '595', '17', '21', '53'],
  ['bulgarian-cheese', 'Bulgarian cheese', '100', ServingUnit.GRAM, '250', '15', '3', '20'],
  ['lean-minced-beef', 'Lean minced beef', '100', ServingUnit.GRAM, '250', '26', '0', '15'],
  ['medium-banana', 'Banana, medium', '1', ServingUnit.PIECE, '105', '1.3', '27', '0.3'],
  ['whey-protein-scoop', 'Whey protein', '1', ServingUnit.SCOOP, '120', '21', '3', '2'],
] as const;

async function main() {
  for (const [slug, name, servingSize, servingUnit, calories, protein, carbs, fat] of foods) {
    await prisma.food.upsert({
      where: { slug },
      update: { name, servingSize, servingUnit, calories, protein, carbs, fat },
      create: { slug, source: FoodSource.SYSTEM, name, servingSize, servingUnit, calories, protein, carbs, fat },
    });
  }
}

void main().finally(async () => prisma.$disconnect());
