// noinspection JSUnusedGlobalSymbols

import type { Config } from '@react-router/dev/config'
import { sentryOnBuildEnd } from '@sentry/react-router'

export default {
  buildEnd: async (args) => {
    // Same build-time gate as vite.config: upload maps only when a token is set
    // (deploy). No token → no-op, so token-less builds are unchanged.
    if (!process.env.SENTRY_AUTH_TOKEN) return
    await sentryOnBuildEnd(args)
  },
  ssr: true,
} satisfies Config
