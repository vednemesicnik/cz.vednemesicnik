import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { generateTOTP, getTOTPAuthUri, verifyTOTP } from '~/utils/totp.server'

// RFC 6238 Appendix B test secret: the ASCII string "12345678901234567890"
// (20 bytes) encoded as base32 (RFC 4648).
const RFC_SECRET = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'

describe('totp.server', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('generateTOTP — RFC 6238 known-answer vectors (SHA-1, 8 digits)', () => {
    // From RFC 6238, Appendix B, Table 1 (SHA-1 rows).
    const vectors: Array<[timeInSeconds: number, expectedOtp: string]> = [
      [59, '94287082'],
      [1111111109, '07081804'],
      [1111111111, '14050471'],
      [1234567890, '89005924'],
      [2000000000, '69279037'],
      [20000000000, '65353130'],
    ]

    for (const [timeInSeconds, expectedOtp] of vectors) {
      test(`T=${timeInSeconds}s → ${expectedOtp}`, async () => {
        vi.setSystemTime(new Date(timeInSeconds * 1000))

        const { otp } = await generateTOTP({
          algorithm: 'SHA-1',
          digits: 8,
          period: 30,
          secret: RFC_SECRET,
        })

        expect(otp).toBe(expectedOtp)
      })
    }
  })

  describe('generateTOTP — defaults', () => {
    test('produces a random secret and a 6-digit numeric otp', async () => {
      vi.setSystemTime(new Date('2026-07-05T00:00:00Z'))

      const result = await generateTOTP()

      expect(result.otp).toMatch(/^\d{6}$/)
      expect(result.digits).toBe(6)
      expect(result.period).toBe(30)
      expect(result.algorithm).toBe('SHA-1')
      expect(result.charSet).toBe('0123456789')
      // 20 random bytes (160 bits) → 32 base32 chars, no padding.
      expect(result.secret).toMatch(/^[A-Z2-7]{32}$/)
    })

    test('two calls generate different random secrets', async () => {
      const a = await generateTOTP()
      const b = await generateTOTP()

      expect(a.secret).not.toBe(b.secret)
    })

    // Regression: the counter for such a far-future time exceeds 2^31-1, which
    // would be truncated by a bitwise (>>) intToBytes. Generate + verify must
    // stay consistent.
    test('round-trips a counter larger than 2^31 (far-future time)', async () => {
      vi.setSystemTime(new Date(70_000_000_000 * 1000))

      const { otp, secret } = await generateTOTP()
      const result = await verifyTOTP({ otp, secret })

      expect(result).toEqual({ delta: 0 })
    })

    // Regression: the digits > 10 branch must wrap on the actual digest length,
    // not a hard-coded 20, so a non-SHA-1 algorithm reads valid bytes.
    test('round-trips >10 digits with a non-SHA-1 algorithm (SHA-256)', async () => {
      vi.setSystemTime(new Date('2026-07-05T12:00:00Z'))

      const { otp, secret } = await generateTOTP({
        algorithm: 'SHA-256',
        digits: 12,
      })
      expect(otp).toMatch(/^\d{12}$/)

      const result = await verifyTOTP({
        algorithm: 'SHA-256',
        digits: 12,
        otp,
        secret,
      })
      expect(result).toEqual({ delta: 0 })
    })
  })

  describe('verifyTOTP', () => {
    test('accepts a freshly generated otp (delta 0)', async () => {
      vi.setSystemTime(new Date('2026-07-05T12:00:00Z'))

      const { otp, secret } = await generateTOTP()
      const result = await verifyTOTP({ otp, secret })

      expect(result).toEqual({ delta: 0 })
    })

    test('rejects an incorrect otp', async () => {
      vi.setSystemTime(new Date('2026-07-05T12:00:00Z'))

      const { secret } = await generateTOTP()
      const result = await verifyTOTP({ otp: '000000', secret })

      expect(result).toBeNull()
    })

    test('accepts an otp from the previous period within the drift window', async () => {
      const baseTime = new Date('2026-07-05T12:00:00Z')
      vi.setSystemTime(baseTime)

      const { otp, secret } = await generateTOTP()

      // Advance one full period; the previous code is still valid with window 1.
      vi.setSystemTime(new Date(baseTime.getTime() + 30_000))

      const withinWindow = await verifyTOTP({ otp, secret, window: 1 })
      expect(withinWindow).toEqual({ delta: -1 })

      const outsideWindow = await verifyTOTP({ otp, secret, window: 0 })
      expect(outsideWindow).toBeNull()
    })

    test('handles a counter of 0 without going negative (clamped window)', async () => {
      // At the Unix epoch the counter is 0; window 1 would start at -1, which is
      // clamped to 0. Generate + verify must still round-trip.
      vi.setSystemTime(new Date(0))

      const { otp, secret } = await generateTOTP()
      const result = await verifyTOTP({ otp, secret, window: 1 })

      expect(result).toEqual({ delta: 0 })
    })

    test('returns null for a malformed secret', async () => {
      const result = await verifyTOTP({
        otp: '123456',
        secret: '!!!not-base32!!!',
      })

      expect(result).toBeNull()
    })

    test('round-trips a non-default algorithm (SHA-256)', async () => {
      vi.setSystemTime(new Date('2026-07-05T12:00:00Z'))

      const { otp, secret } = await generateTOTP({ algorithm: 'SHA-256' })
      const result = await verifyTOTP({ algorithm: 'SHA-256', otp, secret })

      expect(result).toEqual({ delta: 0 })
    })
  })

  describe('getTOTPAuthUri', () => {
    test('builds a spec-compliant otpauth URI', () => {
      const uri = getTOTPAuthUri({
        accountName: 'user@example.com',
        algorithm: 'SHA-1',
        digits: 6,
        issuer: 'Vednemesicnik',
        period: 30,
        secret: RFC_SECRET,
      })

      expect(uri.startsWith('otpauth://totp/')).toBe(true)

      const url = new URL(uri)
      expect(url.searchParams.get('secret')).toBe(RFC_SECRET)
      expect(url.searchParams.get('issuer')).toBe('Vednemesicnik')
      // The otpauth spec requires the algorithm name without dashes.
      expect(url.searchParams.get('algorithm')).toBe('SHA1')
      expect(url.searchParams.get('digits')).toBe('6')
      expect(url.searchParams.get('period')).toBe('30')
      // Label is "issuer:accountName", URI-encoded.
      expect(uri).toContain(
        `${encodeURIComponent('Vednemesicnik')}:${encodeURIComponent('user@example.com')}`,
      )
    })
  })
})
