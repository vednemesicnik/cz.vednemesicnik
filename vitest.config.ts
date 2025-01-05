import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^~\/(.+)/, replacement: "/app/$1" },
      { find: /^~~\/(.+)/, replacement: "/prisma/$1" },
    ],
  },
  test: {
    include: ["./app/**/*.test.{ts,tsx}"],
    restoreMocks: true,
    coverage: {
      include: ["app/**/*.{ts,tsx}"],
      all: true,
    },
  },
})
