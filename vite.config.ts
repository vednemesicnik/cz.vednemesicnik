// noinspection JSUnusedGlobalSymbols

import { reactRouter } from '@react-router/dev/vite'
import {
  type SentryReactRouterBuildOptions,
  sentryReactRouter,
} from '@sentry/react-router'
import { defineConfig } from 'vite'

// Build-time only (never a runtime secret). Present solely on deploy, where the
// Fly builder receives it as a BuildKit build secret; absent for local dev and
// token-less docker builds.
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN

const sentryConfig: SentryReactRouterBuildOptions = {
  authToken: sentryAuthToken,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  sourcemaps: {
    // Upload the maps, then delete them from the output so they are never served.
    filesToDeleteAfterUpload: ['./build/**/*.map'],
  },
}

export default defineConfig(async (config) => ({
  plugins: [
    reactRouter(),
    // Wire Sentry only when the build-time token is present, so local dev and
    // token-less docker builds stay byte-for-byte identical (no maps, no upload).
    ...(sentryAuthToken ? await sentryReactRouter(sentryConfig, config) : []),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 3000,
  },
}))
