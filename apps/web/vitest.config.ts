import { configDefaults, defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  test: { environment: 'jsdom', setupFiles: ['./vitest.setup.ts'], exclude: [...configDefaults.exclude, 'e2e/**', '.next/**'] },
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
});
