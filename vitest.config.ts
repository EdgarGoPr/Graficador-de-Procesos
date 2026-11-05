import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    // Cada test levanta un Postgres en memoria (pglite): en paralelo agotan la memoria del worker.
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 60000
  }
});
