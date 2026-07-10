// noinspection JSUnusedGlobalSymbols,ES6ConvertVarToLetConst

import { ENV_KEYS } from '@constants/env'
import { z } from 'zod'

const schema = z
  .object({
    [ENV_KEYS.NODE_ENV]: z.enum(['production', 'development', 'test'] as const),
    [ENV_KEYS.BASE_URL]: z.string(),
    [ENV_KEYS.SESSION_SECRET]: z.string(),
    [ENV_KEYS.HONEYPOT_SECRET]: z.string(),
    // Which object-store backend to use for every store (images, PDFs, …). Optional
    // (not `.default`) because `initEnv` only validates and does not write parsed
    // values back to `process.env`, so a default here would make the type claim the
    // key is always present when it may be undefined. The volume backend is the
    // runtime fallback in create-object-store.ts.
    [ENV_KEYS.STORE_DRIVER]: z.enum(['volume', 'tigris'] as const).optional(),
    // Root paths of the on-disk stores (Fly volume). Used by the volume driver (and
    // local development); ignored by the Tigris driver. Optional because the volume
    // stores fall back to `/data/images` and `/data/pdfs` and the Tigris driver
    // doesn't use them, so `STORE_DRIVER=tigris` needn't set otherwise-unused vars.
    [ENV_KEYS.IMAGE_STORE_PATH]: z.string().optional(),
    [ENV_KEYS.PDF_STORE_PATH]: z.string().optional(),
    // Tigris/S3 credentials and bucket. Fly sets these automatically for a bucket
    // created via `fly storage create`. Optional in the shape because they are only
    // required when STORE_DRIVER is "tigris" — enforced there by the superRefine
    // below (and again at store construction, see createTigrisObjectStore).
    [ENV_KEYS.AWS_ACCESS_KEY_ID]: z.string().optional(),
    [ENV_KEYS.AWS_SECRET_ACCESS_KEY]: z.string().optional(),
    [ENV_KEYS.AWS_REGION]: z.string().optional(),
    [ENV_KEYS.AWS_ENDPOINT_URL_S3]: z.string().optional(),
    [ENV_KEYS.BUCKET_NAME]: z.string().optional(),
    // Break-glass password sign-in. Disabled by default: the password form is a
    // last-resort emergency path, gated server-side in the sign-in action.
    // Optional (not `.default`) because `initEnv` only validates and never writes
    // parsed values back to `process.env`; keep it `=true` in production until an
    // alternative sign-in method (magic link / OAuth) ships.
    [ENV_KEYS.ALLOW_PASSWORD_SIGN_IN]: z
      .enum(['true', 'false'] as const)
      .optional(),
    // Google OAuth (Workspace SSO) credentials. Optional in the shape so local
    // development works without them (the Google button just errors on submit),
    // but required in production (see the superRefine below).
    [ENV_KEYS.GOOGLE_CLIENT_ID]: z.string().optional(),
    [ENV_KEYS.GOOGLE_CLIENT_SECRET]: z.string().optional(),
    // Google Apps Script web app that sends the magic-link email. Optional locally
    // (the link is logged instead of emailed), required in production (see the
    // superRefine below).
    [ENV_KEYS.GAS_MAGIC_LINK_URL]: z.string().optional(),
    [ENV_KEYS.GAS_MAGIC_LINK_SECRET]: z.string().optional(),
    // Google Apps Script web app that serves the editorial-board contacts (see
    // the SCRIPT__Editorial_Board__Contacts repo). Optional locally (the /redakce
    // page renders a fallback message), required in production (see the
    // superRefine below).
    [ENV_KEYS.GAS_EDITORIAL_BOARD_URL]: z.string().optional(),
    [ENV_KEYS.GAS_EDITORIAL_BOARD_SECRET]: z.string().optional(),
    // WebAuthn relying-party settings for the passkey flow. Optional in the shape
    // so local development falls back gracefully, but required in production (see
    // the superRefine below) — an empty rpID/origin makes every passkey ceremony
    // fail silently.
    [ENV_KEYS.RELYING_PARTY_ID]: z.string().optional(),
    [ENV_KEYS.RELYING_PARTY_NAME]: z.string().optional(),
    [ENV_KEYS.RELYING_PARTY_ORIGIN]: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    // Require each key to be present and non-empty, attributing the failure to its
    // own path with a shared reason.
    const requireKeys = (
      keys: readonly (keyof typeof env)[],
      reason: string,
    ) => {
      for (const key of keys) {
        const value = env[key]

        if (value === undefined || value.trim() === '') {
          ctx.addIssue({
            code: 'custom',
            message: `${key} is required ${reason}`,
            path: [key],
          })
        }
      }
    }

    // Sign-in methods are always active in production and have no runtime guard, so
    // fail fast at boot rather than at the first OAuth callback / magic-link email /
    // WebAuthn ceremony with an empty credential.
    if (env.NODE_ENV === 'production') {
      requireKeys(
        [
          // Google OAuth (Workspace SSO)
          ENV_KEYS.GOOGLE_CLIENT_ID,
          ENV_KEYS.GOOGLE_CLIENT_SECRET,
          // Magic-link email (Google Apps Script)
          ENV_KEYS.GAS_MAGIC_LINK_URL,
          ENV_KEYS.GAS_MAGIC_LINK_SECRET,
          // Editorial-board contacts (Google Apps Script)
          ENV_KEYS.GAS_EDITORIAL_BOARD_URL,
          ENV_KEYS.GAS_EDITORIAL_BOARD_SECRET,
          // Passkey / WebAuthn relying party
          ENV_KEYS.RELYING_PARTY_ID,
          ENV_KEYS.RELYING_PARTY_NAME,
          ENV_KEYS.RELYING_PARTY_ORIGIN,
        ],
        'in production',
      )
    }

    // The Tigris object store is unusable without full S3 credentials. Gate on the
    // driver, not the environment: "tigris" can run outside production (local
    // s3mock) and production can run on the "volume" driver. Mirrors the runtime
    // guard in createTigrisObjectStore, moved up to boot for a consolidated error.
    if (env.STORE_DRIVER === 'tigris') {
      requireKeys(
        [
          ENV_KEYS.AWS_ENDPOINT_URL_S3,
          ENV_KEYS.AWS_REGION,
          ENV_KEYS.AWS_ACCESS_KEY_ID,
          ENV_KEYS.AWS_SECRET_ACCESS_KEY,
          ENV_KEYS.BUCKET_NAME,
        ],
        'when STORE_DRIVER is "tigris"',
      )
    }
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
