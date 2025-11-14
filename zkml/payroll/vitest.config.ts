import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 120000, // 2 minutes per test (for proof generation)
    hookTimeout: 30000,  // 30 seconds for beforeAll/afterAll
    include: ['test/**/*.test.ts'],
    reporters: ['verbose'],
  },
});
