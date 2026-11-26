import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createVerificationCode } from './create-verification-code.server'
import { issueVerificationCode } from './issue-verification-code.server'
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

describe('issueVerificationCode', () => {
  beforeEach(() => {
    sendMock.mockReset().mockResolvedValue(true)
    vi.stubEnv('MEMBERSHIP_VERIFICATION_SECRET', 'secret')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('mails the code made for the address and the moment it answers', async () => {
    const email = nextAddress()

    const result = await issueVerificationCode(email, nextRequest())

    expect(result.status).toBe('sent')
    if (result.status !== 'sent') return
    expect(sendMock).toHaveBeenCalledExactlyOnceWith({
      code: createVerificationCode('secret', email, result.issuedAt),
      email,
    })
  })

  it('answers failed when the e-mail did not go out', async () => {
    sendMock.mockResolvedValue(false)

    await expect(
      issueVerificationCode(nextAddress(), nextRequest()),
    ).resolves.toEqual({ status: 'failed' })
  })

  it('answers failed without a secret, and sends nothing', async () => {
    vi.stubEnv('MEMBERSHIP_VERIFICATION_SECRET', '')

    await expect(
      issueVerificationCode(nextAddress(), nextRequest()),
    ).resolves.toEqual({ status: 'failed' })
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('sends one address 5 codes an hour', async () => {
    const email = nextAddress()

    for (let attempt = 0; attempt < 5; attempt++) {
      await expect(
        issueVerificationCode(email, nextRequest()),
      ).resolves.toMatchObject({
        status: 'sent',
      })
    }

    await expect(
      issueVerificationCode(email, nextRequest()),
    ).resolves.toMatchObject({
      status: 'limited',
    })
    expect(sendMock).toHaveBeenCalledTimes(5)
  })

  it('sends one IP 10 codes an hour', async () => {
    const request = nextRequest()

    for (let attempt = 0; attempt < 10; attempt++) {
      await issueVerificationCode(nextAddress(), request)
    }

    const limited = await issueVerificationCode(nextAddress(), request)
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

    const first = issueVerificationCode(email, nextRequest())
    await vi.waitFor(() => expect(sendMock).toHaveBeenCalledOnce())
    const second = issueVerificationCode(email, nextRequest())

    finishSend(true)

    const [firstResult, secondResult] = await Promise.all([first, second])
    expect(secondResult).toEqual(firstResult)
    expect(sendMock).toHaveBeenCalledOnce()
  })
})
