import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^~\/(.+)/, replacement: '/app/$1' },
      { find: /^~~\/(.+)/, replacement: '/prisma/$1' },
    ],
  },
  test: {
    coverage: {
      all: true,
      include: ['app/**/*.{ts,tsx}'],
    },
    include: ['./app/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
})
