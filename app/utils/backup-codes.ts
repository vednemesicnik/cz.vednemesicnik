import crypto from 'node:crypto'

import bcrypt from 'bcryptjs'

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
