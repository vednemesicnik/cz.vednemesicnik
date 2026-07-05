/**
 * Time-based One-time Password (TOTP) utilities, RFC 6238 (built on the
 * HMAC-based OTP algorithm, RFC 4226).
 *
 * Vendored and adapted from @epic-web/totp (MIT), by Kent C. Dodds, which was
 * itself adapted from notp (MIT). We vendor it instead of depending on the
 * package so the break-glass second factor stays fully offline and free of
 * third-party runtime dependencies. The base32 (RFC 4648) encode/decode helpers
 * are inlined here to drop the base32-encode / base32-decode dependencies.
 *
 * Original sources:
 * - https://github.com/epicweb-dev/totp (MIT)
 * - https://www.npmjs.com/package/notp (MIT)
 *
 * MIT License. Copyright (c) Kent C. Dodds.
 */

// SHA-1 is not secure in general, but for TOTPs it's unrealistic to expect
// security issues, and it's the default for compatibility with authenticator
// apps (Google Authenticator, Authy, 1Password, …).
// See https://www.rfc-editor.org/rfc/rfc4226#page-25 (B.1. SHA-1 Status).
const DEFAULT_ALGORITHM = 'SHA-1'
const DEFAULT_CHAR_SET = '0123456789'
const DEFAULT_DIGITS = 6
const DEFAULT_WINDOW = 1
const DEFAULT_PERIOD = 30

// For all available algorithms, refer to the WebCrypto HmacImportParams hash:
// https://developer.mozilla.org/en-US/docs/Web/API/HmacImportParams#hash
type HashAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' | (string & {})

type GenerateTOTPOptions = {
  period?: number
  digits?: number
  algorithm?: HashAlgorithm
  secret?: string
  charSet?: string
}

type TOTPConfig = {
  otp: string
  secret: string
  period: number
  digits: number
  algorithm: string
  charSet: string
}

type TOTPAuthUriOptions = {
  period: number
  digits: number
  algorithm: HashAlgorithm
  secret: string
  accountName: string
  issuer: string
}

type VerifyTOTPOptions = {
  otp: string
  secret: string
  period?: number
  digits?: number
  algorithm?: HashAlgorithm
  charSet?: string
  window?: number
}

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

/**
 * Encodes a byte array as an RFC 4648 base32 string (with `=` padding).
 */
function base32Encode(bytes: Uint8Array): string {
  let bits = 0
  let value = 0
  let output = ''

  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f]
      bits -= 5
    }

    // Keep only the not-yet-encoded low bits so `value` never overflows.
    value &= (1 << bits) - 1
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f]
  }

  // Pad to a multiple of 8 characters, per RFC 4648.
  while (output.length % 8 !== 0) {
    output += '='
  }

  return output
}

/**
 * Decodes an RFC 4648 base32 string (padding optional) into a byte array.
 */
function base32Decode(input: string): Uint8Array<ArrayBuffer> {
  const cleaned = input.replace(/=+$/, '').toUpperCase()
  let bits = 0
  let value = 0
  const bytes: number[] = []

  for (const char of cleaned) {
    const index = BASE32_ALPHABET.indexOf(char)
    if (index === -1) {
      throw new Error(`Invalid base32 character: ${char}`)
    }

    value = (value << 5) | index
    bits += 5

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
      value &= (1 << bits) - 1
    }
  }

  return new Uint8Array(bytes)
}

/**
 * Converts a number to an 8-byte big-endian byte array (the HOTP counter).
 */
function intToBytes(num: number): Uint8Array<ArrayBuffer> {
  const arr = new Uint8Array(8)
  for (let i = 7; i >= 0; i--) {
    arr[i] = num & 0xff
    num = num >> 8
  }
  return arr
}

/**
 * Calculates the current counter value for the TOTP based on the current time
 * and the specified period.
 */
function getCounter(period: number = DEFAULT_PERIOD): number {
  const now = Date.now()
  return Math.floor(now / 1000 / period)
}

/**
 * Generates an HMAC-based One Time Password (HOTP) from a raw secret.
 */
async function generateHOTP(
  secret: Uint8Array<ArrayBuffer>,
  {
    counter = 0,
    digits = DEFAULT_DIGITS,
    algorithm = DEFAULT_ALGORITHM,
    charSet = DEFAULT_CHAR_SET,
  }: {
    counter?: number
    digits?: number
    algorithm?: HashAlgorithm
    charSet?: string
  } = {},
): Promise<string> {
  const byteCounter = intToBytes(counter)
  const key = await crypto.subtle.importKey(
    'raw',
    secret,
    { hash: algorithm, name: 'HMAC' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, byteCounter)
  const hashBytes = new Uint8Array(signature)
  // The offset is always the last 4 bits of the signature; value: 0-15.
  const offset = hashBytes[hashBytes.length - 1] & 0xf

  let hotpVal = 0n
  // The specification allows 4-10 digits, so stay on a 32-bit number when the
  // digits are less than or equal to 10.
  if (digits <= 10) {
    // Stay compatible with authenticator apps and use only the bottom 32 bits.
    hotpVal =
      0n |
      (BigInt(hashBytes[offset] & 0x7f) << 24n) |
      (BigInt(hashBytes[offset + 1]) << 16n) |
      (BigInt(hashBytes[offset + 2]) << 8n) |
      BigInt(hashBytes[offset + 3])
  } else {
    // Otherwise create a 64-bit value from the hashBytes.
    hotpVal =
      0n |
      (BigInt(hashBytes[offset] & 0x7f) << 56n) |
      (BigInt(hashBytes[offset + 1]) << 48n) |
      (BigInt(hashBytes[offset + 2]) << 40n) |
      (BigInt(hashBytes[offset + 3]) << 32n) |
      (BigInt(hashBytes[offset + 4]) << 24n) |
      // We have only 20 hashBytes; if offset is 15 these indexes are out of the
      // hashBytes, so fall back to the bytes at the start.
      (BigInt(hashBytes[(offset + 5) % 20]) << 16n) |
      (BigInt(hashBytes[(offset + 6) % 20]) << 8n) |
      BigInt(hashBytes[(offset + 7) % 20])
  }

  let hotp = ''
  const charSetLength = BigInt(charSet.length)
  for (let i = 0; i < digits; i++) {
    hotp = charSet.charAt(Number(hotpVal % charSetLength)) + hotp

    // Ensures hotpVal decreases at a fixed rate, independent of charSet length.
    // 10n is compatible with the TOTP algorithm used by authenticator apps.
    hotpVal = hotpVal / 10n
  }

  return hotp
}

/**
 * Verifies an HOTP against a raw secret within the given counter window.
 *
 * @returns `{ delta }` (offset between the current and verified counter) or
 * `null` when the OTP could not be verified.
 */
async function verifyHOTP(
  otp: string,
  secret: Uint8Array<ArrayBuffer>,
  {
    counter = 0,
    digits = DEFAULT_DIGITS,
    algorithm = DEFAULT_ALGORITHM,
    charSet = DEFAULT_CHAR_SET,
    window = DEFAULT_WINDOW,
  }: {
    counter?: number
    digits?: number
    algorithm?: HashAlgorithm
    charSet?: string
    window?: number
  } = {},
): Promise<{ delta: number } | null> {
  for (let i = counter - window; i <= counter + window; ++i) {
    const candidate = await generateHOTP(secret, {
      algorithm,
      charSet,
      counter: i,
      digits,
    })
    if (candidate === otp) {
      return { delta: i - counter }
    }
  }
  return null
}

/**
 * Creates a time-based one-time password (TOTP). Generates a random base32
 * secret (unless provided) and the TOTP for the current time, and returns the
 * config used so it can be stored (maps 1:1 onto the `Verification` model).
 */
export async function generateTOTP({
  period = DEFAULT_PERIOD,
  digits = DEFAULT_DIGITS,
  algorithm = DEFAULT_ALGORITHM,
  secret = base32Encode(crypto.getRandomValues(new Uint8Array(10))),
  charSet = DEFAULT_CHAR_SET,
}: GenerateTOTPOptions = {}): Promise<TOTPConfig> {
  const otp = await generateHOTP(base32Decode(secret), {
    algorithm,
    charSet,
    counter: getCounter(Number(period)),
    digits: Number(digits),
  })

  return { algorithm, charSet, digits, otp, period, secret }
}

/**
 * Builds an `otpauth://totp/…` URI for a QR code or manual entry into an
 * authenticator app.
 */
export function getTOTPAuthUri({
  period,
  digits,
  algorithm,
  secret,
  accountName,
  issuer,
}: TOTPAuthUriOptions): string {
  const params = new URLSearchParams({
    // The otpauth URI spec requires the algorithm name without dashes.
    algorithm: algorithm.replaceAll('-', ''),
    digits: digits.toString(),
    issuer,
    period: period.toString(),
    secret,
  })

  const escapedIssuer = encodeURIComponent(issuer)
  const escapedAccountName = encodeURIComponent(accountName)
  const label = `${escapedIssuer}:${escapedAccountName}`

  return `otpauth://totp/${label}?${params.toString()}`
}

/**
 * Verifies a TOTP against a stored base32 secret for the current time.
 *
 * @returns `{ delta }` (offset between the current and verified time step) or
 * `null` when the OTP is invalid.
 */
export async function verifyTOTP({
  otp,
  secret,
  period = DEFAULT_PERIOD,
  digits = DEFAULT_DIGITS,
  algorithm = DEFAULT_ALGORITHM,
  charSet = DEFAULT_CHAR_SET,
  window = DEFAULT_WINDOW,
}: VerifyTOTPOptions): Promise<{ delta: number } | null> {
  let decodedSecret: Uint8Array<ArrayBuffer>
  try {
    decodedSecret = base32Decode(secret)
  } catch {
    // If the secret is invalid, treat the verification as failed.
    return null
  }

  return verifyHOTP(otp, decodedSecret, {
    algorithm,
    charSet,
    counter: getCounter(period),
    digits,
    window,
  })
}
