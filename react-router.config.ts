// noinspection JSUnusedGlobalSymbols

import type { Config } from '@react-router/dev/config'
import { sentryOnBuildEnd } from '@sentry/react-router'

export default {
  buildEnd: async (args) => {
    // Same build-time gate as vite.config: upload only when fully configured
    // (token + org + project). Partial/absent config → no-op, so token-less
    // builds are unchanged and a misconfigured deploy never fails the build.
    if (
      !(
        process.env.SENTRY_AUTH_TOKEN &&
        process.env.SENTRY_ORG &&
        process.env.SENTRY_PROJECT
      )
    ) {
      return
    }
    await sentryOnBuildEnd(args)
  },
  ssr: true,
} satisfies Config
