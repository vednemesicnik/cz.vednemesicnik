import { createHmac } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The cookie reads it on import.
vi.hoisted(() => {
  process.env.SESSION_SECRET = 'test-session-secret'
})

import { readActivityAnsweredCookie } from '~/utils/editorial-board-activity/read-activity-answered-cookie.server'
import { postEditorialBoardMembershipWrite } from '~/utils/editorial-board-membership.server'
import { checkHoneypot } from '~/utils/honeypot.server'

import { action } from './_action'

vi.mock('~/utils/honeypot.server', () => ({ checkHoneypot: vi.fn() }))
vi.mock('~/utils/editorial-board-membership.server', () => ({
  postEditorialBoardMembershipWrite: vi.fn(),
}))

const writeMock = vi.mocked(postEditorialBoardMembershipWrite)

const SECRET = 'test-link-secret'
const CONFIRM_PATH = '/editorial-board/activity/confirm'
const EXP = Date.parse('2026-11-23T23:00:00Z') / 1000

const tokenFor = (action: string, exp = EXP) => {
  const encoded = Buffer.from(
    JSON.stringify({ action, email: 'anna@local.dev', exp }),
  ).toString('base64url')
  return `${encoded}.${createHmac('sha256', SECRET).update(encoded).digest('hex')}`
}

const run = (values: Record<string, string>) => {
  const body = new FormData()
  for (const [name, value] of Object.entries(values)) body.set(name, value)

  return action({
    request: new Request(`http://localhost${CONFIRM_PATH}`, {
      body,
      method: 'POST',
    }),
  } as never)
}

// A redirect is thrown; `data()` is returned.
const runToRedirect = async (values: Record<string, string>) => {
  const result = await run(values).catch((thrown) => thrown)
  if (!(result instanceof Response)) throw new Error('Expected a redirect.')
  return result
}

const runToData = async (values: Record<string, string>) =>
  (await run(values)) as unknown as {
    data: { result: string }
    init: { status: number }
  }

describe('activity confirmation action', () => {
  beforeEach(() => {
    vi.stubEnv('GAS_EDITORIAL_BOARD_LINK_SECRET', SECRET)
    vi.useFakeTimers({ now: Date.parse('2026-11-10T12:00:00Z') })
    writeMock.mockReset().mockResolvedValue({ idempotent: false, ok: true })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.useRealTimers()
  })

  it.each(['confirmActive', 'leave', 'reactivate'] as const)(
    'posts %s for the address in the link and moves on to done',
    async (linkAction) => {
      const response = await runToRedirect({ token: tokenFor(linkAction) })

      expect(checkHoneypot).toHaveBeenCalled()
      expect(writeMock).toHaveBeenCalledExactlyOnceWith({
        action: linkAction,
        email: 'anna@local.dev',
      })
      expect(response.status).toBe(303)
      expect(response.headers.get('Location')).toBe(`${CONFIRM_PATH}/done`)

      const cookie = response.headers.get('Set-Cookie')?.split(';')[0] ?? ''
      await expect(
        readActivityAnsweredCookie(
          new Request('http://localhost', { headers: { Cookie: cookie } }),
        ),
      ).resolves.toBe(linkAction)
    },
  )

  it('ends on done for a repeat as well', async () => {
    writeMock.mockResolvedValue({ idempotent: true, ok: true })

    const response = await runToRedirect({ token: tokenFor('leave') })

    expect(response.headers.get('Location')).toBe(`${CONFIRM_PATH}/done`)
  })

  it.each(['not_found', 'not_active', 'not_removed', 'ambiguous'] as const)(
    'shows the unusable page when the script answers %s',
    async (error) => {
      writeMock.mockResolvedValue({ error, ok: false, retryable: false })

      const result = await runToData({ token: tokenFor('confirmActive') })

      expect(result.data).toEqual({ result: 'unusable' })
      expect(result.init.status).toBe(409)
    },
  )

  it.each(['busy', 'unreachable', 'server_error'] as const)(
    'keeps the link and the button for %s',
    async (error) => {
      writeMock.mockResolvedValue({ error, ok: false, retryable: true })

      const result = await runToData({ token: tokenFor('leave') })

      expect(result.data).toEqual({ result: 'failed' })
      expect(result.init.status).toBe(503)
    },
  )

  it('writes nothing for an expired link and goes back to its page', async () => {
    const token = tokenFor('leave', Date.parse('2026-11-01T00:00:00Z') / 1000)
    const response = await runToRedirect({ token })

    expect(writeMock).not.toHaveBeenCalled()
    expect(response.status).toBe(303)
    expect(response.headers.get('Location')).toBe(
      `${CONFIRM_PATH}?${new URLSearchParams({ token })}`,
    )
  })

  it.each([
    [
      'a tampered token',
      {
        token: tokenFor('leave').replace(/.$/, (last) =>
          last === 'a' ? 'b' : 'a',
        ),
      },
    ],
    ['an oversized token', { token: 'a'.repeat(5000) }],
    ['no token', {}],
  ])(
    'writes nothing for %s and goes back without echoing it',
    async (_case, values: Record<string, string>) => {
      const response = await runToRedirect(values)

      expect(writeMock).not.toHaveBeenCalled()
      expect(response.status).toBe(303)
      expect(response.headers.get('Location')).toBe(CONFIRM_PATH)
    },
  )
})
