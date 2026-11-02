import { createHmac } from 'node:crypto'
import type { Envelope } from '@generated/magic-link/response'
import * as Sentry from '@sentry/react-router'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  test,
  vi,
} from 'vitest'
import { sendMagicLinkEmail } from './send-magic-link-email.server'
import type { SignedGasEnvelope } from './sign-gas-request.server'

// The envelope is built inside the transport now, so this is what ties it to the
// shape the script publishes.
expectTypeOf<SignedGasEnvelope>().toExtend<Envelope>()

// Avoid any real Sentry side effects: the module import must stay inert.
vi.mock('@sentry/react-router', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

const jsonResponse = (json: unknown, status = 200) => ({
  json: async () => json,
  ok: status >= 200 && status < 300,
  status,
})

const recipient = { email: 'a@vednemesicnik.cz', link: 'https://x.test/verify' }

let originalUrl: string | undefined
let originalSecret: string | undefined
let originalDsn: string | undefined

// A failed send waits out the retry delay; these tests have nothing to learn from it.
const send = async (request = recipient): Promise<boolean> => {
  const pending = sendMagicLinkEmail(request)
  await vi.runAllTimersAsync()
  return pending
}

const restoreEnv = (key: string, value: string | undefined): void => {
  if (value === undefined) {
    delete process.env[key]
  } else {
    process.env[key] = value
  }
}

beforeEach(() => {
  originalUrl = process.env.GAS_MAGIC_LINK_URL
  originalSecret = process.env.GAS_MAGIC_LINK_SECRET
  originalDsn = process.env.SENTRY_DSN

  process.env.GAS_MAGIC_LINK_URL = 'https://example.test/exec'
  process.env.GAS_MAGIC_LINK_SECRET = 'test-secret'
  delete process.env.SENTRY_DSN

  vi.useFakeTimers()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.mocked(Sentry.captureException).mockClear()
  vi.mocked(Sentry.captureMessage).mockClear()
  restoreEnv('GAS_MAGIC_LINK_URL', originalUrl)
  restoreEnv('GAS_MAGIC_LINK_SECRET', originalSecret)
  restoreEnv('SENTRY_DSN', originalDsn)
})

describe('sendMagicLinkEmail', () => {
  test('logs the specific error and mailerError on a delegated send failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          error: 'mailer_send_failed',
          mailerError: 'unauthorized',
          ok: false,
        }),
      ),
    )

    await expect(send()).resolves.toBe(false)

    expect(console.error).toHaveBeenCalledOnce()
    const [message] = vi.mocked(console.error).mock.calls[0]
    expect(message).toContain('error mailer_send_failed')
    expect(message).toContain('mailerError unauthorized')
  })

  test('does not log on a successful send', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ ok: true })),
    )

    await expect(send()).resolves.toBe(true)

    expect(console.error).not.toHaveBeenCalled()
  })

  test('tries a blip once more, and the retry can deliver', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(null, 404))
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(send()).resolves.toBe(true)

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(console.error).not.toHaveBeenCalled()
  })

  test('swallows a blip that does not pass, after two attempts', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(null, 404))
    vi.stubGlobal('fetch', fetchMock)

    await expect(send()).resolves.toBe(false)

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(console.error).toHaveBeenCalledOnce()
    const [message] = vi.mocked(console.error).mock.calls[0]
    expect(message).toContain('status 404')
    expect(message).toContain('error unreachable')
  })

  test('does not retry a settled refusal', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ error: 'unauthorized', ok: false }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(send()).resolves.toBe(false)

    expect(fetchMock).toHaveBeenCalledOnce()
  })

  test('logs unreachable when the body is not JSON (GAS HTML error page)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => {
          throw new SyntaxError('Unexpected token <')
        },
        ok: true,
        status: 200,
      }),
    )

    await send()

    expect(console.error).toHaveBeenCalledOnce()
    const [message] = vi.mocked(console.error).mock.calls[0]
    expect(message).toContain('error unreachable')
    expect(message).toContain('mailerError —')
  })

  test('swallows and logs when the request throws (network / timeout)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')))

    await expect(send()).resolves.toBe(false)

    expect(console.error).toHaveBeenCalledOnce()
    expect(console.error).toHaveBeenCalledWith(
      '[magic-link] GAS request threw —',
      expect.any(Error),
    )
  })

  test('reports a thrown request to Sentry as the exception it was', async () => {
    process.env.SENTRY_DSN = 'https://key@sentry.test/1'
    const failure = new Error('boom')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(failure))

    await send()

    expect(Sentry.captureException).toHaveBeenCalledExactlyOnceWith(failure)
    expect(Sentry.captureMessage).not.toHaveBeenCalled()
  })

  test('no-ops without logging a failure when GAS is not configured', async () => {
    delete process.env.GAS_MAGIC_LINK_URL
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await send()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(console.error).not.toHaveBeenCalled()
  })

  test('posts a signed envelope and never the secret itself', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await send()

    const [, requestInit] = fetchMock.mock.calls[0]
    const sentBody = requestInit.body as string

    // The whole point of the change: nothing that logs this request has logged a
    // usable credential.
    expect(sentBody).not.toContain('test-secret')

    const envelope = JSON.parse(sentBody)
    expect(Object.keys(envelope).sort()).toEqual([
      'payload',
      'signature',
      'timestamp',
    ])
    expect(JSON.parse(envelope.payload)).toEqual(recipient)

    // Verified the way Toolkit.verifySignature does it on the other side.
    const expected = createHmac('sha256', 'test-secret')
      .update(`${envelope.timestamp}.${envelope.payload}`)
      .digest('hex')
    expect(envelope.signature).toBe(expected)
  })
})
