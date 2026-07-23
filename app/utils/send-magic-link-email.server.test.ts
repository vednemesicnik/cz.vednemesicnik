import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { sendMagicLinkEmail } from './send-magic-link-email.server'

// Avoid any real Sentry side effects; SENTRY_DSN is unset below so these are
// never called, but the module import must stay inert.
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

  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
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

    await sendMagicLinkEmail(recipient)

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

    await sendMagicLinkEmail(recipient)

    expect(console.error).not.toHaveBeenCalled()
  })

  test('logs placeholders when the body is not JSON (GAS HTML error page)', async () => {
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

    await sendMagicLinkEmail(recipient)

    expect(console.error).toHaveBeenCalledOnce()
    const [message] = vi.mocked(console.error).mock.calls[0]
    expect(message).toContain('error —')
    expect(message).toContain('mailerError —')
  })

  test('swallows and logs when the request throws (network / timeout)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')))

    await expect(sendMagicLinkEmail(recipient)).resolves.toBeUndefined()
    expect(console.error).toHaveBeenCalledWith(
      '[magic-link] GAS request threw —',
      expect.any(Error),
    )
  })

  test('no-ops without logging a failure when GAS is not configured', async () => {
    delete process.env.GAS_MAGIC_LINK_URL
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await sendMagicLinkEmail(recipient)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(console.error).not.toHaveBeenCalled()
  })
})
