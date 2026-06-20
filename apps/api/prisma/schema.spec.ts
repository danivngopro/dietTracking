import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Prisma schema', () => {
  it('contains ownership, plan date, snapshot, and decimal constraints', () => {
    const schema = readFileSync(join(__dirname, 'schema.prisma'), 'utf8');
    expect(schema).toContain('enum FoodSource');
    expect(schema).toMatch(/userId\s+String\?/);
    expect(schema).toContain('@@unique([userId, date])');
    expect(schema).toMatch(/mealPlanItemId\s+String\?\s+@unique/);
    expect(schema).toContain('@db.Decimal(12, 3)');
  });
});
