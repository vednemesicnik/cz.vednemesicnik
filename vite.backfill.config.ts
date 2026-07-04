// noinspection JSUnusedGlobalSymbols

// Standalone Vite (SSR) build that bundles the one-time issue-PDF backfill script
// into `build/backfill-issue-pdfs.mjs`. This lets it run inside the production
// container / on Fly with `node build/backfill-issue-pdfs.mjs` — no `tsx` and no
// `app/` source in the image are needed, because the app source it imports
// (`~/utils/db.server`, `~/utils/pdf-store/*`) is bundled in. node_modules stay
// external and are required from the production install (`@prisma/*`,
// `better-sqlite3`, `@aws-sdk/client-s3`, `dotenv`).
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    // Do not wipe the react-router build output this runs alongside.
    emptyOutDir: false,
    outDir: 'build',
    rollupOptions: {
      output: {
        entryFileNames: 'backfill-issue-pdfs.mjs',
      },
    },
    ssr: 'scripts/backfill-issue-pdfs.ts',
    target: 'node22',
  },
  // Resolve the app's `~`/`@generated` path aliases so the imported source bundles.
  resolve: {
    tsconfigPaths: true,
  },
})
