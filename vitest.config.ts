import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/scripts/**/*.test.ts'],
    environment: 'node',
    testTimeout: 60000,
    hookTimeout: 45000,
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
    reporters: ['verbose'],
  },
});
