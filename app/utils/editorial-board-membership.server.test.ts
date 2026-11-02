import * as Sentry from '@sentry/react-router'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { postEditorialBoardMembershipWrite } from './editorial-board-membership.server'

vi.mock('@sentry/react-router', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

const jsonResponse = (json: unknown, status = 200) => ({
  json: async () => json,
  ok: status >= 200 && status < 300,
  status,
})

const ENROLMENT = {
  action: 'enrol' as const,
  email: 'tereza@local.dev',
  formSubmittedAt: '2026-11-02T10:00:00.000Z',
  name: 'Tereza Malá',
}

const LEAVE = { action: 'leave' as const, email: 'tereza@local.dev' }

const sentPayload = (fetchMock: ReturnType<typeof vi.fn>, call: number) =>
  JSON.parse(JSON.parse(fetchMock.mock.calls[call][1].body as string).payload)

// Runs a write across the transport's retry delay.
const settle = async <TResult>(pending: Promise<TResult>): Promise<TResult> => {
  await vi.runAllTimersAsync()
  return pending
}

const stubFetch = (...responses: unknown[]) => {
  const fetchMock = vi.fn()
  for (const response of responses) {
    fetchMock.mockResolvedValueOnce(response)
  }
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

beforeEach(() => {
  vi.stubEnv('GAS_EDITORIAL_BOARD_MEMBERSHIP_URL', 'https://example.test/exec')
  vi.stubEnv('GAS_EDITORIAL_BOARD_MEMBERSHIP_SECRET', 'test-secret')
  vi.stubEnv('SENTRY_DSN', 'https://sentry.example.test/1')

  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('postEditorialBoardMembershipWrite', () => {
  test('sends the write with a key of its own and reports success', async () => {
    const fetchMock = stubFetch(jsonResponse({ ok: true }))

    await expect(postEditorialBoardMembershipWrite(ENROLMENT)).resolves.toEqual(
      { idempotent: false, ok: true },
    )

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(sentPayload(fetchMock, 0)).toEqual({
      ...ENROLMENT,
      idempotencyKey: expect.stringMatching(/^[A-Za-z0-9-]{16,64}$/),
    })
  })

  test('says when an earlier attempt did the work', async () => {
    stubFetch(jsonResponse({ idempotent: true, ok: true }))

    await expect(postEditorialBoardMembershipWrite(LEAVE)).resolves.toEqual({
      idempotent: true,
      ok: true,
    })
  })

  test('retries a blip with the same key, as one write', async () => {
    const fetchMock = stubFetch(
      jsonResponse({ error: 'busy', ok: false }),
      jsonResponse({ ok: true }),
    )

    await expect(
      settle(postEditorialBoardMembershipWrite(LEAVE)),
    ).resolves.toEqual({ idempotent: false, ok: true })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(sentPayload(fetchMock, 1).idempotencyKey).toBe(
      sentPayload(fetchMock, 0).idempotencyKey,
    )
  })

  test('uses a new key for a new call', async () => {
    const fetchMock = stubFetch(
      jsonResponse({ ok: true }),
      jsonResponse({ ok: true }),
    )

    await postEditorialBoardMembershipWrite(LEAVE)
    await postEditorialBoardMembershipWrite(LEAVE)

    expect(sentPayload(fetchMock, 1).idempotencyKey).not.toBe(
      sentPayload(fetchMock, 0).idempotencyKey,
    )
  })

  test.each(['not_found', 'not_active'] as const)(
    'treats %s as an answer: no retry, nothing reported',
    async (error) => {
      const fetchMock = stubFetch(jsonResponse({ error, ok: false }))

      await expect(postEditorialBoardMembershipWrite(LEAVE)).resolves.toEqual({
        error,
        ok: false,
        retryable: false,
      })

      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(Sentry.captureMessage).not.toHaveBeenCalled()
    },
  )

  test.each([
    'ambiguous',
    'invalid_request',
    'missing_fields',
    'server_misconfigured',
    'stale_timestamp',
    'unauthorized',
  ] as const)('reports %s without retrying', async (error) => {
    const fetchMock = stubFetch(jsonResponse({ error, ok: false }))

    await expect(postEditorialBoardMembershipWrite(LEAVE)).resolves.toEqual({
      error,
      ok: false,
      retryable: false,
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      '[editorial-board-membership] write failed',
      expect.objectContaining({
        fingerprint: ['editorial-board-membership', 'gas-write-failed', error],
      }),
    )
  })

  test.each(['busy', 'server_error'] as const)(
    'reports %s after one retry, as retryable',
    async (error) => {
      const fetchMock = stubFetch(
        jsonResponse({ error, ok: false }),
        jsonResponse({ error, ok: false }),
      )

      await expect(
        settle(postEditorialBoardMembershipWrite(LEAVE)),
      ).resolves.toEqual({ error, ok: false, retryable: true })

      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(Sentry.captureMessage).toHaveBeenCalledTimes(1)
    },
  )

  test('bounds an unexpected code in the answer and the fingerprint', async () => {
    stubFetch(
      jsonResponse({ error: 'something_new', ok: false }),
      jsonResponse({ error: 'something_new', ok: false }),
    )

    await expect(
      settle(postEditorialBoardMembershipWrite(LEAVE)),
    ).resolves.toEqual({ error: 'unknown', ok: false, retryable: true })

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      '[editorial-board-membership] write failed',
      expect.objectContaining({
        extra: expect.objectContaining({ gasError: 'something_new' }),
        fingerprint: [
          'editorial-board-membership',
          'gas-write-failed',
          'unknown',
        ],
      }),
    )
  })

  test('does not trust a success that breaks the contract', async () => {
    stubFetch(jsonResponse({ idempotent: 'yes', ok: true }))

    await expect(postEditorialBoardMembershipWrite(LEAVE)).resolves.toEqual({
      error: 'unknown',
      ok: false,
      retryable: true,
    })

    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1)
  })

  test('reports a thrown request as unreachable and never throws', async () => {
    const failure = new Error('network down')
    const fetchMock = vi.fn().mockRejectedValue(failure)
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      settle(postEditorialBoardMembershipWrite(LEAVE)),
    ).resolves.toEqual({ error: 'unreachable', ok: false, retryable: true })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(Sentry.captureException).toHaveBeenCalledWith(failure, {
      fingerprint: ['editorial-board-membership', 'gas-request-threw'],
    })
    expect(Sentry.captureMessage).not.toHaveBeenCalled()
  })

  test('keeps the address out of the log', async () => {
    stubFetch(jsonResponse({ error: 'unauthorized', ok: false }))

    await postEditorialBoardMembershipWrite(LEAVE)

    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
      LEAVE.email,
    )
  })

  describe('without a deployment', () => {
    beforeEach(() => {
      vi.stubEnv('GAS_EDITORIAL_BOARD_MEMBERSHIP_URL', '')
    })

    test('logs and succeeds outside production, without posting', async () => {
      const fetchMock = stubFetch()

      await expect(postEditorialBoardMembershipWrite(LEAVE)).resolves.toEqual({
        idempotent: false,
        ok: true,
      })

      expect(fetchMock).not.toHaveBeenCalled()
    })

    test('fails in production, so no flow believes it wrote', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const fetchMock = stubFetch()

      await expect(postEditorialBoardMembershipWrite(LEAVE)).resolves.toEqual({
        error: 'server_misconfigured',
        ok: false,
        retryable: false,
      })

      expect(fetchMock).not.toHaveBeenCalled()
    })
  })
})
