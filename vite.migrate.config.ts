// noinspection JSUnusedGlobalSymbols

// Standalone Vite (SSR) build that bundles the one-time volume→Tigris image-store
// migration script into `build/migrate-tigris.mjs`. This lets it run inside the
// production container / on Fly with `node build/migrate-tigris.mjs` — no `tsx`
// and no `app/` source in the image are needed, because the app source it imports
// (`app/utils/image-store/*`, via a relative path) is bundled in. node_modules stay
// external and are required from the production install (`@aws-sdk/client-s3`, `dotenv`).
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    // Do not wipe the react-router build output this runs alongside.
    emptyOutDir: false,
    outDir: 'build',
    rollupOptions: {
      output: {
        entryFileNames: 'migrate-tigris.mjs',
      },
    },
    ssr: 'scripts/migrate-image-store-to-tigris.ts',
    target: 'node22',
  },
})
