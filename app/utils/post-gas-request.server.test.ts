import { afterEach, describe, expect, test, vi } from 'vitest'
import { postGasRequest } from './post-gas-request.server'

// Minimal stand-in for the fetch Response the helper consumes (status + json()).
const jsonResponse = (json: unknown, status = 200) => ({
  json: async () => json,
  ok: status >= 200 && status < 300,
  status,
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('postGasRequest', () => {
  test('returns ok, status, and parsed data for a JSON response', async () => {
    const payload = { ok: true }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(payload)))

    const result = await postGasRequest('https://example.test/exec', { a: 1 })

    expect(result).toEqual({ data: payload, ok: true, status: 200 })
  })

  test('sends a JSON POST with the serialized body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await postGasRequest('https://example.test/exec', { email: 'a@b.cz' })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://example.test/exec')
    expect(init.method).toBe('POST')
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(init.body).toBe(JSON.stringify({ email: 'a@b.cz' }))
  })

  test('yields data: null when the body is not JSON', async () => {
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

    const result = await postGasRequest('https://example.test/exec', {})

    expect(result).toEqual({ data: null, ok: true, status: 200 })
  })

  test('reflects a non-2xx status with ok: false', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ ok: false }, 500)),
    )

    const result = await postGasRequest('https://example.test/exec', {})

    expect(result.ok).toBe(false)
    expect(result.status).toBe(500)
  })

  test('propagates when fetch rejects (network / timeout)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')))

    await expect(
      postGasRequest('https://example.test/exec', {}),
    ).rejects.toThrow('boom')
  })
})
