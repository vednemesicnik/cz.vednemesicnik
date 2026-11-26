import { defineConfig } from 'vitest/config'

// The host's tests. The web has its own config in apps/web.
export default defineConfig({
  test: {
    include: ['./server/**/*.test.ts', './instrument.server.test.ts'],
    restoreMocks: true,
  },
})
