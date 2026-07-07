import crypto from 'node:crypto'

import bcrypt from 'bcryptjs'

import { prisma } from '~/utils/db.server'
import { throwDbError } from '~/utils/throw-db-error.server'

// Number of backup codes issued per set.
export const BACKUP_CODE_COUNT = 10

// bcrypt cost factor, matching Password.hash.
const BCRYPT_ROUNDS = 10

// Unambiguous alphabet — no 0/1 and no i/l/o — so codes are easy to read and
// transcribe from the downloaded file.
const CODE_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz'
const CODE_LENGTH = 8

// Strip formatting so a code entered as "K7M2-9XQP", "k7m2 9xqp" or "k7m29xqp"
// all resolve to the same stored hash.
export const canonicalizeBackupCode = (input: string) =>
  input.toLowerCase().replace(/[^a-z0-9]/g, '')

// One display code, e.g. "k7m2-9xqp". The canonical form (dash stripped) is what
// gets hashed and compared.
const generateBackupCode = () => {
  let raw = ''

  for (let i = 0; i < CODE_LENGTH; i++) {
    raw += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]
  }

  return `${raw.slice(0, 4)}-${raw.slice(4)}`
}

// Pure generation: unique plaintext codes paired with their bcrypt hashes. The
// caller displays the codes once and persists only the hashes.
export const createBackupCodeSet = () => {
  const codes = new Set<string>()

  while (codes.size < BACKUP_CODE_COUNT) {
    codes.add(generateBackupCode())
  }

  return [...codes].map((code) => ({
    code,
    hash: bcrypt.hashSync(canonicalizeBackupCode(code), BCRYPT_ROUNDS),
  }))
}

// Pure matching: index of the first hash the input matches, or -1. The caller
// passes only unused hashes and marks the winner as used (single-use).
export const matchBackupCodeHash = (input: string, hashes: string[]) => {
  const canonical = canonicalizeBackupCode(input)

  return hashes.findIndex((hash) => bcrypt.compareSync(canonical, hash))
}

// Replace the user's entire set with a fresh one, returning the plaintext codes
// for a single display. Invalidates all previous codes (used and unused).
export const regenerateBackupCodes = async (userId: string) => {
  const set = createBackupCodeSet()

  try {
    await prisma.$transaction([
      prisma.backupCode.deleteMany({ where: { userId } }),
      prisma.backupCode.createMany({
        data: set.map(({ hash }) => ({ codeHash: hash, userId })),
      }),
    ])
  } catch (error) {
    throwDbError(error, 'Unable to regenerate the backup codes.')
  }

  return set.map(({ code }) => code)
}

// Try to redeem an entered code against the user's unused codes. On a match the
// row is marked used and true is returned; single-use is enforced by usedAt.
export const redeemBackupCode = async (userId: string, input: string) => {
  try {
    const codes = await prisma.backupCode.findMany({
      select: { codeHash: true, id: true },
      where: { usedAt: null, userId },
    })

    const index = matchBackupCodeHash(
      input,
      codes.map(({ codeHash }) => codeHash),
    )

    if (index === -1) {
      return false
    }

    // Conditional update guards against a race: only the request that flips
    // usedAt from null wins, so a code can never be redeemed twice even under
    // concurrent sign-in attempts.
    const result = await prisma.backupCode.updateMany({
      data: { usedAt: new Date() },
      where: { id: codes[index].id, usedAt: null },
    })

    return result.count === 1
  } catch (error) {
    return throwDbError(error, 'Unable to redeem the backup code.')
  }
}

// Remaining unused codes — drives the low-codes warning / regenerate prompt.
export const countUnusedBackupCodes = async (userId: string) => {
  try {
    return await prisma.backupCode.count({ where: { usedAt: null, userId } })
  } catch (error) {
    return throwDbError(error, 'Unable to count the backup codes.')
  }
}
