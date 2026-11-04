import { createHmac } from 'node:crypto'
import * as Sentry from '@sentry/react-router'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { postSignedGasRequest } from './post-signed-gas-request.server'

vi.mock('@sentry/react-router', () => ({
  captureMessage: vi.fn(),
}))

const ENDPOINT = {
  endpoint: 'magic-link',
  secret: 'test-secret',
  url: 'https://example.test/exec',
} as const

const REQUEST = { idempotencyKey: 'enrol:abc', name: 'Jana' }

type TestRequest = typeof REQUEST
type TestSuccess = { value?: number }

const jsonResponse = (json: unknown, status = 200) => ({
  json: async () => json,
  ok: status >= 200 && status < 300,
  status,
})

const notJsonResponse = () => ({
  json: async () => {
    throw new SyntaxError('Unexpected token <')
  },
  ok: true,
  status: 200,
})

const post = (
  request: TestRequest = REQUEST,
  idempotencyKeyField: keyof TestRequest | undefined = 'idempotencyKey',
) =>
  postSignedGasRequest<TestSuccess, TestRequest>(ENDPOINT, request, {
    idempotencyKeyField,
  })

// Runs a request across its retry delay, advancing the clock past it.
const settle = async <TResult>(pending: Promise<TResult>): Promise<TResult> => {
  await vi.runAllTimersAsync()
  return pending
}

const sentEnvelope = (fetchMock: ReturnType<typeof vi.fn>, call: number) =>
  JSON.parse(fetchMock.mock.calls[call][1].body as string)

let originalDsn: string | undefined

beforeEach(() => {
  originalDsn = process.env.SENTRY_DSN
  delete process.env.SENTRY_DSN

  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-02T12:00:00Z'))
  vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.mocked(Sentry.captureMessage).mockClear()

  if (originalDsn === undefined) {
    delete process.env.SENTRY_DSN
  } else {
    process.env.SENTRY_DSN = originalDsn
  }
})

describe('postSignedGasRequest', () => {
  test('answers the success body after one POST', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ ok: true, value: 1 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(settle(post())).resolves.toEqual({ ok: true, value: 1 })

    expect(fetchMock).toHaveBeenCalledOnce()
  })

  test('sends a signed envelope, never the secret', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await settle(post())

    expect(fetchMock.mock.calls[0][1].body).not.toContain('test-secret')

    const envelope = sentEnvelope(fetchMock, 0)
    expect(Object.keys(envelope).sort()).toEqual([
      'payload',
      'signature',
      'timestamp',
    ])
    expect(envelope.signature).toBe(
      createHmac('sha256', 'test-secret')
        .update(`${envelope.timestamp}.${envelope.payload}`)
        .digest('hex'),
    )
  })

  test('retries a blip once with a fresh timestamp and the key intact', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(null, 404))
      .mockResolvedValueOnce(jsonResponse({ ok: true, value: 2 }))
    vi.stubGlobal('fetch', fetchMock)
    // Late in a second: the delay alone has to carry the retry into the next one.
    vi.setSystemTime(new Date('2026-11-02T12:00:00.900Z'))

    await expect(settle(post())).resolves.toEqual({ ok: true, value: 2 })

    expect(fetchMock).toHaveBeenCalledTimes(2)

    const first = sentEnvelope(fetchMock, 0)
    const second = sentEnvelope(fetchMock, 1)
    expect(second.timestamp).toBeGreaterThan(first.timestamp)
    expect(second.signature).not.toBe(first.signature)
    expect(second.payload).toBe(first.payload)
    expect(JSON.parse(second.payload).idempotencyKey).toBe('enrol:abc')
  })

  test.each([
    ['a thrown request', () => Promise.reject(new Error('boom'))],
    ['an error status', async () => jsonResponse(null, 404)],
    ['a body that is not JSON', async () => notJsonResponse()],
  ])('gives up after two attempts at %s', async (_name, respond) => {
    const fetchMock = vi.fn().mockImplementation(respond)
    vi.stubGlobal('fetch', fetchMock)

    const result = await settle(post())

    expect(result).toMatchObject({
      error: 'unreachable',
      ok: false,
      retryable: true,
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  test.each([
    'ambiguous',
    'invalid_request',
    'link_not_allowed',
    'missing_fields',
    'not_active',
    'not_found',
    'server_misconfigured',
    'stale_timestamp',
    'unauthorized',
  ])('does not retry the settled error %s', async (error) => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ error, ok: false }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(settle(post())).resolves.toEqual({
      error,
      ok: false,
      retryable: false,
      status: 200,
    })
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  test('treats an unknown code as retryable and keeps the mailerError', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        error: 'mailer_send_failed',
        mailerError: 'unreachable',
        ok: false,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(settle(post())).resolves.toEqual({
      error: 'mailer_send_failed',
      mailerError: 'unreachable',
      ok: false,
      retryable: true,
      status: 200,
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  test('calls an answer without a code a server_error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ ok: false })),
    )

    await expect(settle(post())).resolves.toMatchObject({
      error: 'server_error',
    })
  })

  test('hands the caller the error of the last attempt', async () => {
    const lastFailure = new Error('second')
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValueOnce(new Error('first'))
        .mockRejectedValueOnce(lastFailure),
    )

    const result = await settle(post())

    expect(result).toMatchObject({ error: 'unreachable', status: null })
    expect(result).toHaveProperty('cause', lastFailure)
  })

  test('has a cause when only the retry threw', async () => {
    const failure = new Error('boom')
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(null, 404))
        .mockRejectedValueOnce(failure),
    )

    await expect(settle(post())).resolves.toHaveProperty('cause', failure)
  })

  test('has no cause when the last attempt was answered', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValueOnce(jsonResponse(null, 404)),
    )

    const result = await settle(post())

    expect(result).toMatchObject({ error: 'unreachable', status: 404 })
    expect(result).not.toHaveProperty('cause')
  })

  test('tries once without opting in', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('boom'))
    vi.stubGlobal('fetch', fetchMock)

    const result = await settle(
      postSignedGasRequest<TestSuccess, TestRequest>(ENDPOINT, REQUEST),
    )

    expect(result).toMatchObject({ error: 'unreachable', retryable: true })
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  test('tries once when the key is empty', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('boom'))
    vi.stubGlobal('fetch', fetchMock)

    await settle(post({ ...REQUEST, idempotencyKey: '' }))

    expect(fetchMock).toHaveBeenCalledOnce()
  })

  test('reports a rescued attempt to Sentry without the request', async () => {
    process.env.SENTRY_DSN = 'https://key@sentry.test/1'
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(null, 404))
        .mockResolvedValueOnce(jsonResponse({ ok: true })),
    )

    await settle(post())

    expect(Sentry.captureMessage).toHaveBeenCalledExactlyOnceWith(
      '[gas] retry rescued a request',
      {
        extra: { endpoint: 'magic-link', error: 'unreachable', status: 404 },
        fingerprint: ['gas', 'retry-rescued', 'magic-link'],
        level: 'warning',
      },
    )
  })

  test('reports nothing when the first attempt succeeds or both fail', async () => {
    process.env.SENTRY_DSN = 'https://key@sentry.test/1'
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse({ ok: true }))
        .mockRejectedValue(new Error('boom')),
    )

    await settle(post())
    await settle(post())

    expect(Sentry.captureMessage).not.toHaveBeenCalled()
  })
})
