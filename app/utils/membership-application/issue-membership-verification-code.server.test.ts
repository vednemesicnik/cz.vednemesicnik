import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createVerificationCode } from '~/utils/email-verification/create-verification-code.server'

import { issueMembershipVerificationCode } from './issue-membership-verification-code.server'
import { sendVerificationCodeEmail } from './send-verification-code-email.server'

vi.mock('./send-verification-code-email.server', () => ({
  sendVerificationCodeEmail: vi.fn(),
}))

const sendMock = vi.mocked(sendVerificationCodeEmail)

// The store is shared and lives as long as the process: every test takes its own
// address and its own IP.
let counter = 0
const nextAddress = () => `tereza${++counter}@local.dev`
const requestFrom = (ip: string) =>
  new Request('https://local.dev/', { headers: { 'X-Forwarded-For': ip } })
const nextRequest = () => requestFrom(`10.0.0.${++counter}`)

describe('issueMembershipVerificationCode', () => {
  beforeEach(() => {
    sendMock.mockReset().mockResolvedValue(true)
    vi.stubEnv('MEMBERSHIP_VERIFICATION_SECRET', 'secret')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('mails the code made for the address and the moment it answers', async () => {
    const email = nextAddress()

    const result = await issueMembershipVerificationCode(email, nextRequest())

    expect(result.status).toBe('sent')
    if (result.status !== 'sent') return
    expect(sendMock).toHaveBeenCalledExactlyOnceWith({
      code: createVerificationCode({
        email,
        issuedAt: result.issuedAt,
        purpose: 'membership-verify',
        secret: 'secret',
      }),
      email,
    })
  })

  it('answers failed when the e-mail did not go out', async () => {
    sendMock.mockResolvedValue(false)

    await expect(
      issueMembershipVerificationCode(nextAddress(), nextRequest()),
    ).resolves.toEqual({ status: 'failed' })
  })

  it('answers failed without a secret, and sends nothing', async () => {
    vi.stubEnv('MEMBERSHIP_VERIFICATION_SECRET', '')

    await expect(
      issueMembershipVerificationCode(nextAddress(), nextRequest()),
    ).resolves.toEqual({ status: 'failed' })
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('sends one address 5 codes an hour', async () => {
    const email = nextAddress()

    for (let attempt = 0; attempt < 5; attempt++) {
      await expect(
        issueMembershipVerificationCode(email, nextRequest()),
      ).resolves.toMatchObject({
        status: 'sent',
      })
    }

    await expect(
      issueMembershipVerificationCode(email, nextRequest()),
    ).resolves.toMatchObject({
      status: 'limited',
    })
    expect(sendMock).toHaveBeenCalledTimes(5)
  })

  it('sends one IP 10 codes an hour', async () => {
    const request = nextRequest()

    for (let attempt = 0; attempt < 10; attempt++) {
      await issueMembershipVerificationCode(nextAddress(), request)
    }

    const limited = await issueMembershipVerificationCode(
      nextAddress(),
      request,
    )
    expect(limited).toMatchObject({ status: 'limited' })
    expect(sendMock).toHaveBeenCalledTimes(10)
  })

  it('makes no second code while one is on its way, and shares its answer', async () => {
    const email = nextAddress()
    let finishSend = (_isSent: boolean) => {}
    sendMock.mockReturnValueOnce(
      new Promise((resolve) => {
        finishSend = resolve
      }),
    )

    const first = issueMembershipVerificationCode(email, nextRequest())
    await vi.waitFor(() => expect(sendMock).toHaveBeenCalledOnce())
    const second = issueMembershipVerificationCode(email, nextRequest())

    finishSend(true)

    const [firstResult, secondResult] = await Promise.all([first, second])
    expect(secondResult).toEqual(firstResult)
    expect(sendMock).toHaveBeenCalledOnce()
  })
})
