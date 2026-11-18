import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

/**
 * Encrypts a token for the database: AES-256-GCM with a fresh 12-byte IV, stored as base64 of
 * IV, tag and ciphertext together. GCM rather than a plain cipher, because the tag makes a value
 * that was altered, or written under another key, fail to decrypt instead of decrypting to
 * garbage that would be sent to Google.
 */

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const TAG_LENGTH = 16

export function encryptToken(token: string, key: Buffer): string {
  let iv = randomBytes(IV_LENGTH)
  let cipher = createCipheriv(ALGORITHM, key, iv)
  let ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64')
}

/** Throws when the value was altered or encrypted under another key. */
export function decryptToken(stored: string, key: Buffer): string {
  let bytes = Buffer.from(stored, 'base64')
  if (bytes.length <= IV_LENGTH + TAG_LENGTH) throw new Error('The stored token is too short.')

  let iv = bytes.subarray(0, IV_LENGTH)
  let tag = bytes.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
  let decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([
    decipher.update(bytes.subarray(IV_LENGTH + TAG_LENGTH)),
    decipher.final(),
  ]).toString('utf8')
}
