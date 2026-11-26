import { randomBytes, timingSafeEqual } from 'node:crypto'

import { prisma } from '~/utils/db.server'
import { getContentHash } from '~/utils/hash.server'
import { throwDbError } from '~/utils/throw-db-error.server'

// Magic-link sign-in reuses the shared Verification model with a dedicated type;
// target is the email, secret is the SHA-256 hash of the token, expiresAt bounds
// the link lifetime. The OTP columns (algorithm/digits/period/charSet) stay null.
export const MAGIC_LINK_VERIFICATION_TYPE = 'magic-link'

// How long a requested link stays valid.
export const MAGIC_LINK_TTL_MS = 15 * 60 * 1000

// 32 random bytes → 256 bits of entropy, transported base64url in the link.
const TOKEN_BYTES = 32

// Constant-time compare of two hex hashes of equal length.
const hashesMatch = (a: string, b: string) => {
  const bufferA = Buffer.from(a, 'hex')
  const bufferB = Buffer.from(b, 'hex')

  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB)
}

/**
 * Issues a magic-link token for the given email: stores the token's hash in a
 * `Verification` row (upsert on `target_type`, so a fresh request invalidates the
 * previous link) and returns the raw token to embed in the emailed URL.
 */
export const createMagicLinkToken = async (email: string) => {
  const token = randomBytes(TOKEN_BYTES).toString('base64url')
  const secret = getContentHash(token)
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MS)

  try {
    await prisma.verification.upsert({
      create: {
        expiresAt,
        secret,
        target: email,
        type: MAGIC_LINK_VERIFICATION_TYPE,
      },
      update: { expiresAt, secret },
      where: {
        target_type: {
          target: email,
          type: MAGIC_LINK_VERIFICATION_TYPE,
        },
      },
    })
  } catch (error) {
    return throwDbError(error, 'Unable to store the magic-link verification.')
  }

  return token
}

// Loads the magic-link verification row for an email, or null when absent.
const getMagicLinkVerification = async (email: string) => {
  try {
    return await prisma.verification.findUnique({
      select: { expiresAt: true, secret: true },
      where: {
        target_type: {
          target: email,
          type: MAGIC_LINK_VERIFICATION_TYPE,
        },
      },
    })
  } catch (error) {
    return throwDbError(error, 'Unable to load the magic-link verification.')
  }
}

/**
 * Checks a token against the stored hash and expiry without consuming it. Used
 * by the verify loader to decide whether to render the confirm button.
 */
export const verifyMagicLinkToken = async (email: string, token: string) => {
  const verification = await getMagicLinkVerification(email)

  if (verification === null) return false
  // A missing expiry counts as invalid: magic links are always TTL-bounded, and
  // consumeMagicLinkToken requires `expiresAt > now` — keep the two consistent so
  // a null-expiry row can't render a "valid" page that can never be consumed.
  if (verification.expiresAt === null || verification.expiresAt <= new Date()) {
    return false
  }

  return hashesMatch(getContentHash(token), verification.secret)
}

/**
 * Atomically consumes a magic-link token: deletes the row only when it matches
 * the token's hash and is still unexpired, and returns whether exactly one row
 * was removed. Deciding on the delete count (rather than a separate read) makes
 * it single-use under concurrency and stops a wrong token from invalidating a
 * valid link — the filter by `secret` means a mismatching token deletes nothing.
 * Called by the verify action right before signing the user in.
 */
export const consumeMagicLinkToken = async (email: string, token: string) => {
  const secret = getContentHash(token)

  try {
    const { count } = await prisma.verification.deleteMany({
      where: {
        expiresAt: { gt: new Date() },
        secret,
        target: email,
        type: MAGIC_LINK_VERIFICATION_TYPE,
      },
    })

    return count === 1
  } catch (error) {
    return throwDbError(error, 'Unable to consume the magic-link verification.')
  }
}
