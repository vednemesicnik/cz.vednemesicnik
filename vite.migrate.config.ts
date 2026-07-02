// noinspection JSUnusedGlobalSymbols

// Standalone Vite (SSR) build that bundles the one-time image-store backfill
// script into `build/migrate-images.mjs`. This lets the backfill run inside the
// production container / on Fly with `node build/migrate-images.mjs` — no `tsx`
// and no `app/` source in the image are needed, because the app source it imports
// (`~/utils/image-store/*`, configs, the generated Prisma client) is bundled in.
// node_modules stay external and are required from the production install.
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    // Do not wipe the react-router build output this runs alongside.
    emptyOutDir: false,
    outDir: 'build',
    rollupOptions: {
      output: {
        entryFileNames: 'migrate-images.mjs',
      },
    },
    ssr: 'scripts/migrate-images-to-store.ts',
    target: 'node22',
  },
  resolve: {
    tsconfigPaths: true,
  },
})
