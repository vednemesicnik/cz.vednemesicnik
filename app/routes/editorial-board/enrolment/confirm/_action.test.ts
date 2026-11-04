import { beforeEach, describe, expect, it, vi } from 'vitest'

import { consumeEnrolmentToken } from '~/utils/editorial-board-enrolment/consume-enrolment-token.server'
import { findEnrolmentByToken } from '~/utils/editorial-board-enrolment/find-enrolment-by-token.server'
import { hasEnrolmentConfirmedCookie } from '~/utils/editorial-board-enrolment/has-enrolment-confirmed-cookie.server'
import { postEditorialBoardMembershipWrite } from '~/utils/editorial-board-membership.server'
import { checkHoneypot } from '~/utils/honeypot.server'

import { action } from './_action'

vi.mock('~/utils/honeypot.server', () => ({ checkHoneypot: vi.fn() }))
vi.mock(
  '~/utils/editorial-board-enrolment/find-enrolment-by-token.server',
  () => ({ findEnrolmentByToken: vi.fn() }),
)
vi.mock(
  '~/utils/editorial-board-enrolment/consume-enrolment-token.server',
  () => ({ consumeEnrolmentToken: vi.fn() }),
)
vi.mock('~/utils/editorial-board-membership.server', () => ({
  postEditorialBoardMembershipWrite: vi.fn(),
}))

const honeypotMock = vi.mocked(checkHoneypot)
const findMock = vi.mocked(findEnrolmentByToken)
const writeMock = vi.mocked(postEditorialBoardMembershipWrite)
const consumeMock = vi.mocked(consumeEnrolmentToken)

const CONFIRM_PATH = '/editorial-board/enrolment/confirm'
const PAYLOAD = {
  formSubmittedAt: '2026-11-03T10:00:00.000Z',
  interest: 'psaní',
  name: 'Tereza Malá',
  phone: '604 123 456',
}

const run = (values: Record<string, string> = { token: 'token' }) => {
  const body = new FormData()
  for (const [name, value] of Object.entries(values)) body.set(name, value)

  return action({
    request: new Request(`http://localhost${CONFIRM_PATH}?token=token`, {
      body,
      method: 'POST',
    }),
  } as never)
}

// A redirect is thrown; `data()` is returned.
const runToRedirect = async (...args: Parameters<typeof run>) => {
  const result = await run(...args).catch((thrown) => thrown)
  if (!(result instanceof Response)) throw new Error('Expected a redirect.')
  return result
}

const runToFailure = async () =>
  (await run()) as unknown as {
    data: { failed: boolean }
    init: { status: number }
  }

describe('enrolment confirmation action', () => {
  beforeEach(() => {
    honeypotMock.mockReset()
    findMock.mockReset().mockResolvedValue({
      email: 'tereza@local.dev',
      payload: PAYLOAD,
    })
    writeMock.mockReset().mockResolvedValue({ idempotent: false, ok: true })
    consumeMock.mockReset().mockResolvedValue(true)
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('writes first, spends the token after, and moves on', async () => {
    const response = await runToRedirect()

    expect(response.status).toBe(303)
    expect(response.headers.get('Location')).toBe(`${CONFIRM_PATH}/done`)
    expect(writeMock).toHaveBeenCalledExactlyOnceWith({
      action: 'enrol',
      email: 'tereza@local.dev',
      ...PAYLOAD,
    })
    expect(consumeMock).toHaveBeenCalledExactlyOnceWith('token')
    expect(writeMock.mock.invocationCallOrder[0]).toBeLessThan(
      consumeMock.mock.invocationCallOrder[0] as number,
    )
  })

  it('opens the confirmed page for this browser', async () => {
    const response = await runToRedirect()
    const cookie = (response.headers.get('Set-Cookie') ?? '').split(';')[0]

    await expect(
      hasEnrolmentConfirmedCookie(
        new Request(`http://localhost${CONFIRM_PATH}/done`, {
          headers: { Cookie: cookie },
        }),
      ),
    ).resolves.toBe(true)
  })

  it('opens nothing for a press that lost the race', async () => {
    consumeMock.mockResolvedValue(false)

    const response = await runToRedirect()

    expect(response.headers.get('Set-Cookie')).toBeNull()
  })

  it('leaves the token when the write fails, so the button can try again', async () => {
    writeMock.mockResolvedValue({
      error: 'unreachable',
      ok: false,
      retryable: true,
    })

    const result = await runToFailure()

    expect(result.init.status).toBe(503)
    expect(result.data.failed).toBe(true)
    expect(consumeMock).not.toHaveBeenCalled()
  })

  it('sends a press that lost the race back to the link', async () => {
    consumeMock.mockResolvedValue(false)

    const response = await runToRedirect()

    expect(response.status).toBe(303)
    expect(response.headers.get('Location')).toBe(`${CONFIRM_PATH}?token=token`)
  })

  it('writes nothing for a spent or unknown token', async () => {
    findMock.mockResolvedValue(null)

    const response = await runToRedirect()

    expect(response.headers.get('Location')).toBe(`${CONFIRM_PATH}?token=token`)
    expect(writeMock).not.toHaveBeenCalled()
    expect(consumeMock).not.toHaveBeenCalled()
  })

  it('offers a retry when the database fails on the lookup', async () => {
    findMock.mockRejectedValue(new Error('database is locked'))

    const result = await runToFailure()

    expect(result.init.status).toBe(503)
    expect(writeMock).not.toHaveBeenCalled()
  })

  it('offers a retry when the database fails on spending the token', async () => {
    consumeMock.mockRejectedValue(new Error('database is locked'))

    const result = await runToFailure()

    expect(result.init.status).toBe(503)
  })

  it('checks the honeypot first', async () => {
    honeypotMock.mockImplementation(() => {
      throw new Response('Invalid form.', { status: 400 })
    })

    const response = await runToRedirect()

    expect(response.status).toBe(400)
    expect(findMock).not.toHaveBeenCalled()
  })

  it('sends a request without a token to the page, which says it cannot be used', async () => {
    const response = await runToRedirect({})

    expect(response.headers.get('Location')).toBe(CONFIRM_PATH)
    expect(findMock).not.toHaveBeenCalled()
  })
})
