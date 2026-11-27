import { defineConfig } from 'vitest/config'

// The host's tests and the release script's. The web has its own config in apps/web.
export default defineConfig({
  test: {
    include: [
      './server/**/*.test.ts',
      './instrument.server.test.ts',
      './scripts/**/*.test.ts',
    ],
    restoreMocks: true,
  },
})
