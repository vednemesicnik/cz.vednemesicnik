// noinspection JSUnusedGlobalSymbols,ES6ConvertVarToLetConst

import { ENV_KEYS } from '@constants/env'
import { z } from 'zod'

const schema = z.object({
  [ENV_KEYS.NODE_ENV]: z.enum(['production', 'development', 'test'] as const),
  [ENV_KEYS.BASE_URL]: z.string(),
  [ENV_KEYS.SESSION_SECRET]: z.string(),
  [ENV_KEYS.HONEYPOT_SECRET]: z.string(),
})

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface ProcessEnv extends z.infer<typeof schema> {}
  }
}

export function initEnv() {
  const result = schema.safeParse(process.env)

  if (!result.success) {
    console.error(
      'Invalid environment variables:',
      z.flattenError(result.error).fieldErrors,
    )
    throw new Error('Invalid environment variables')
  }

  return
}

/**
 * Returns a subset of environment variables that are safe to expose to the client.
 *
 * This function is used in two contexts:
 * 1. Server-side: To populate the global.ENV object
 * 2. Client-side: To populate the window.ENV object
 *
 * SECURITY WARNING: Only add environment variables that are safe for public exposure.
 * Never include API keys, secrets, or sensitive credentials.
 *
 * @returns Client-safe environment variables
 */
export function getEnv() {
  return {
    BASE_URL: process.env.BASE_URL,
    MODE: process.env.NODE_ENV,
  }
}

type ENV = ReturnType<typeof getEnv>

declare global {
  // eslint-disable-next-line no-var
  var ENV: ENV
  interface Window {
    ENV: ENV
  }
}
