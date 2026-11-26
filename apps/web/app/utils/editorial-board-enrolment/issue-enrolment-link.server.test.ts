import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createEnrolmentToken } from './create-enrolment-token.server'
import { issueEnrolmentLink } from './issue-enrolment-link.server'
import { sendEnrolmentEmail } from './send-enrolment-email.server'

vi.mock('./create-enrolment-token.server', () => ({
  createEnrolmentToken: vi.fn(),
}))
vi.mock('./send-enrolment-email.server', () => ({
  sendEnrolmentEmail: vi.fn(),
}))

const tokenMock = vi.mocked(createEnrolmentToken)
const sendMock = vi.mocked(sendEnrolmentEmail)

const PAYLOAD = {
  formSubmittedAt: '2026-11-03T10:00:00.000Z',
  name: 'Tereza Malá',
  phone: '+420 600 000 000',
}

// The store is shared and lives as long as the process: every test takes its own address.
let addressCounter = 0
const nextAddress = () => `tereza${++addressCounter}@local.dev`

describe('issueEnrolmentLink', () => {
  beforeEach(() => {
    tokenMock.mockReset().mockResolvedValue('token')
    sendMock.mockReset().mockResolvedValue(true)
    vi.stubEnv('BASE_URL', 'https://local.dev')
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('stores the enrolment and mails its link', async () => {
    const email = nextAddress()

    await expect(issueEnrolmentLink(email, PAYLOAD)).resolves.toEqual({
      status: 'sent',
    })

    expect(tokenMock).toHaveBeenCalledExactlyOnceWith(email, PAYLOAD)
    expect(sendMock).toHaveBeenCalledExactlyOnceWith({
      email,
      link: 'https://local.dev/editorial-board/enrolment/confirm?token=token',
    })
  })

  it('answers failed when the e-mail did not go out', async () => {
    sendMock.mockResolvedValue(false)

    await expect(issueEnrolmentLink(nextAddress(), PAYLOAD)).resolves.toEqual({
      status: 'failed',
    })
  })

  it('answers failed when the row cannot be stored, and sends nothing', async () => {
    tokenMock.mockRejectedValue(new Error('database is locked'))

    await expect(issueEnrolmentLink(nextAddress(), PAYLOAD)).resolves.toEqual({
      status: 'failed',
    })
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('mints no second token while a link is on its way, and shares its answer', async () => {
    const email = nextAddress()
    let finishSend = (_isSent: boolean) => {}
    sendMock.mockReturnValueOnce(
      new Promise((resolve) => {
        finishSend = resolve
      }),
    )

    const first = issueEnrolmentLink(email, PAYLOAD)
    await vi.waitFor(() => expect(sendMock).toHaveBeenCalledOnce())
    const second = issueEnrolmentLink(email, PAYLOAD)

    finishSend(false)

    await expect(first).resolves.toEqual({ status: 'failed' })
    await expect(second).resolves.toEqual({ status: 'failed' })
    expect(tokenMock).toHaveBeenCalledOnce()
    expect(sendMock).toHaveBeenCalledOnce()
  })

  it('takes the next request on its own once the send has answered', async () => {
    const email = nextAddress()

    await issueEnrolmentLink(email, PAYLOAD)
    await issueEnrolmentLink(email, PAYLOAD)

    expect(tokenMock).toHaveBeenCalledTimes(2)
  })

  it('refuses the sixth attempt in an hour, counting the failed ones', async () => {
    const email = nextAddress()
    sendMock.mockResolvedValue(false)

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await issueEnrolmentLink(email, PAYLOAD)
    }

    const refused = await issueEnrolmentLink(email, PAYLOAD)

    expect(refused).toEqual({
      retryAfter: expect.any(Number),
      status: 'limited',
    })
    expect(tokenMock).toHaveBeenCalledTimes(5)
  })
})
