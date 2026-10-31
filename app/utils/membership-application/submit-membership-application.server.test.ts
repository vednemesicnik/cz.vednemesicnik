import { createHmac } from 'node:crypto'

import * as Sentry from '@sentry/react-router'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { submitMembershipApplication } from './submit-membership-application.server'

vi.mock('@sentry/react-router', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

const jsonResponse = (json: unknown, status = 200) => ({
  json: async () => json,
  ok: status >= 200 && status < 300,
  status,
})

const application = {
  action: 'submit' as const,
  address: 'Lannova 12, 370 01 České Budějovice',
  code: 'VDM-7K3Q-2P',
  dateOfBirth: '2009-05-14',
  declaration: { data: 'JVBERi0=', mimeType: 'application/pdf' as const },
  email: 'tereza@priklad.cz',
  firstName: 'Tereza',
  isMinor: true,
  lastName: 'Malá',
  phone: '604 123 456',
}

const keys = [
  'GAS_MEMBERSHIP_URL',
  'GAS_MEMBERSHIP_SECRET',
  'SENTRY_DSN',
] as const
let originalValues: Record<(typeof keys)[number], string | undefined>

beforeEach(() => {
  originalValues = Object.fromEntries(
    keys.map((key) => [key, process.env[key]]),
  ) as typeof originalValues

  process.env.GAS_MEMBERSHIP_URL = 'https://example.test/exec'
  process.env.GAS_MEMBERSHIP_SECRET = 'test-secret'
  delete process.env.SENTRY_DSN

  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  for (const key of keys) {
    const value = originalValues[key]
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
})

describe('submitMembershipApplication', () => {
  test('posts a signed envelope carrying the code, never the secret', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ code: application.code, ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await submitMembershipApplication(application)

    expect(result).toEqual({
      acknowledgementSent: true,
      code: application.code,
      ok: true,
    })
    const [, init] = fetchMock.mock.lastCall ?? []
    const envelope = JSON.parse(init.body)
    expect(JSON.parse(envelope.payload)).toEqual(application)
    expect(envelope.signature).toBe(
      createHmac('sha256', 'test-secret')
        .update(`${envelope.timestamp}.${envelope.payload}`)
        .digest('hex'),
    )
    expect(init.body).not.toContain('test-secret')
  })

  test('waits up to 60 s, because the request carries the scan', async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout')
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(jsonResponse({ code: application.code, ok: true })),
    )

    await submitMembershipApplication(application)

    expect(timeoutSpy).toHaveBeenLastCalledWith(60_000)
    timeoutSpy.mockRestore()
  })

  test('a stored application whose acknowledgement failed is still ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          code: application.code,
          mailerError: 'unreachable',
          ok: true,
        }),
      ),
    )

    const result = await submitMembershipApplication(application)

    expect(result).toEqual({
      acknowledgementSent: false,
      code: application.code,
      ok: true,
    })
  })

  test('a refused request is rejected, a far-side failure is unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse({ error: 'invalid_declaration', ok: false }),
        )
        .mockResolvedValueOnce(jsonResponse({ error: 'busy', ok: false })),
    )

    expect(await submitMembershipApplication(application)).toEqual({
      ok: false,
      reason: 'rejected',
    })
    expect(await submitMembershipApplication(application)).toEqual({
      ok: false,
      reason: 'unavailable',
    })
  })

  test('a transport error is unavailable and reported, never thrown', async () => {
    process.env.SENTRY_DSN = 'https://dsn.example.test/1'
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')))

    const result = await submitMembershipApplication(application)

    expect(result).toEqual({ ok: false, reason: 'unavailable' })
    expect(Sentry.captureException).toHaveBeenCalledOnce()
  })

  test('without configuration it only logs outside production', async () => {
    delete process.env.GAS_MEMBERSHIP_URL
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    vi.stubEnv('NODE_ENV', 'development')
    expect(await submitMembershipApplication(application)).toEqual({
      acknowledgementSent: true,
      code: application.code,
      ok: true,
    })

    vi.stubEnv('NODE_ENV', 'production')
    expect(await submitMembershipApplication(application)).toEqual({
      ok: false,
      reason: 'unavailable',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
