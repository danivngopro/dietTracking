import { existsSync } from 'node:fs';

const required = [
  'apps/api/package.json',
  'apps/web/package.json',
  'packages/shared/package.json',
  'docker-compose.yml',
];

const missing = required.filter((path) => !existsSync(path));
if (missing.length > 0) {
  throw new Error(`Missing workspace files: ${missing.join(', ')}`);
}
