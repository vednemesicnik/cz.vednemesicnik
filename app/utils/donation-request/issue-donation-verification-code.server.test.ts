import { beforeEach, describe, expect, it, vi } from 'vitest'

import { checkVerificationCode } from '~/utils/email-verification/check-verification-code.server'

import { issueDonationVerificationCode } from './issue-donation-verification-code.server'
import { sendDonationVerificationCodeEmail } from './send-donation-verification-code-email.server'

vi.mock('./send-donation-verification-code-email.server', () => ({
  sendDonationVerificationCodeEmail: vi.fn(),
}))

const sendMock = vi.mocked(sendDonationVerificationCodeEmail)

// The store is shared and lives as long as the process: every test takes its own
// address and its own IP.
let counter = 0
const nextAddress = () => `donor${++counter}@local.dev`
const nextRequest = () =>
  new Request('https://local.dev/', {
    headers: { 'X-Forwarded-For': `10.2.0.${++counter}` },
  })

describe('issueDonationVerificationCode', () => {
  beforeEach(() => {
    sendMock.mockReset().mockResolvedValue(true)
    vi.stubEnv('DONATION_VERIFICATION_SECRET', 'secret')
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('mails a code that checks for donations and not for membership', async () => {
    const email = nextAddress()

    const result = await issueDonationVerificationCode(email, nextRequest())

    expect(result.status).toBe('sent')
    if (result.status !== 'sent') return
    const { code } = sendMock.mock.calls[0][0]
    const check = (purpose: 'donation-verify' | 'membership-verify') =>
      checkVerificationCode({
        code,
        email,
        issuedAt: result.issuedAt,
        now: result.issuedAt + 1000,
        purpose,
        secret: 'secret',
      })
    expect(check('donation-verify')).toBe('valid')
    expect(check('membership-verify')).toBe('wrong')
  })

  it('answers failed without its own secret', async () => {
    vi.stubEnv('DONATION_VERIFICATION_SECRET', '')

    await expect(
      issueDonationVerificationCode(nextAddress(), nextRequest()),
    ).resolves.toEqual({ status: 'failed' })
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('sends one address 5 codes an hour', async () => {
    const email = nextAddress()

    for (let attempt = 0; attempt < 5; attempt++) {
      await issueDonationVerificationCode(email, nextRequest())
    }

    await expect(
      issueDonationVerificationCode(email, nextRequest()),
    ).resolves.toMatchObject({ status: 'limited' })
    expect(sendMock).toHaveBeenCalledTimes(5)
  })
})
