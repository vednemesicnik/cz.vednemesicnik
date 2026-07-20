// noinspection JSUnusedGlobalSymbols

import { reactRouter } from '@react-router/dev/vite'
import {
  type SentryReactRouterBuildOptions,
  sentryReactRouter,
} from '@sentry/react-router'
import { defineConfig } from 'vite'

// Build-time only (never runtime secrets). Present solely on deploy, where the Fly
// builder receives the token as a BuildKit build secret and org/project as build
// args; all absent for local dev and token-less docker builds.
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN
const sentryOrg = process.env.SENTRY_ORG
const sentryProject = process.env.SENTRY_PROJECT

// Require all three inputs: a partial config (e.g. token set but org/project
// missing) skips Sentry rather than failing the production build.
const isSentryUploadEnabled = Boolean(
  sentryAuthToken && sentryOrg && sentryProject,
)

const sentryConfig: SentryReactRouterBuildOptions = {
  authToken: sentryAuthToken,
  org: sentryOrg,
  project: sentryProject,
  sourcemaps: {
    // Upload the maps, then delete them from the output so they are never served.
    filesToDeleteAfterUpload: ['./build/**/*.map'],
  },
}

export default defineConfig(async (config) => ({
  plugins: [
    reactRouter(),
    // Wire Sentry only when fully configured, so local dev and token-less docker
    // builds stay byte-for-byte identical (no maps, no upload).
    ...(isSentryUploadEnabled
      ? await sentryReactRouter(sentryConfig, config)
      : []),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 3000,
  },
}))
