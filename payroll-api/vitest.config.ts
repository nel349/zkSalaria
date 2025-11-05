import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Run test files sequentially to avoid testnet conflicts
    fileParallelism: false,
    // Keep tests within a file sequential too
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Increase timeouts for network operations
    testTimeout: 10 * 60 * 1000, // 10 minutes per test
    hookTimeout: 10 * 60 * 1000, // 10 minutes for beforeAll/afterAll
    // Only show failures by default
    reporters: ['verbose'],
  },
});
