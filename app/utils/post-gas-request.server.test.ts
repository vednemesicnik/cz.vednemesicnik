import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { postGasRequest } from './post-gas-request.server'

const EXEC_URL = 'https://example.test/macros/s/deployment-id/exec'
const OPTIONS = { endpoint: 'magic-link' } as const

// Minimal stand-in for the fetch Response the helper consumes (status + json()).
const jsonResponse = (json: unknown, status = 200) => ({
  json: async () => json,
  ok: status >= 200 && status < 300,
  status,
})

const redirectResponse = (location: string | null, status = 302) => ({
  body: { cancel: vi.fn().mockResolvedValue(undefined) },
  headers: new Headers(location === null ? {} : { location }),
  json: async () => {
    throw new SyntaxError('Unexpected token <')
  },
  ok: false,
  status,
})

const SECOND_HOP_URL =
  'https://script.googleusercontent.com/macros/echo?user_content_key=private-key'

const loggedLines = () =>
  [
    ...vi.mocked(console.info).mock.calls,
    ...vi.mocked(console.warn).mock.calls,
  ].map(([line]) => String(line))

beforeEach(() => {
  vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('postGasRequest', () => {
  test('returns ok, status, and parsed data for a JSON response', async () => {
    const payload = { ok: true }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(payload)))

    const result = await postGasRequest(EXEC_URL, { a: 1 }, OPTIONS)

    expect(result).toEqual({ data: payload, ok: true, status: 200 })
  })

  test('sends a JSON POST with the serialized body, not following redirects', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await postGasRequest(EXEC_URL, { email: 'a@local.dev' }, OPTIONS)

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, requestInit] = fetchMock.mock.calls[0]
    expect(url).toBe(EXEC_URL)
    expect(requestInit.method).toBe('POST')
    expect(requestInit.redirect).toBe('manual')
    expect(requestInit.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(requestInit.body).toBe(JSON.stringify({ email: 'a@local.dev' }))
  })

  test('walks the redirect: a GET without a body under the same signal', async () => {
    const payload = { ok: true }
    const firstResponse = redirectResponse(SECOND_HOP_URL)
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(firstResponse)
      .mockResolvedValueOnce(jsonResponse(payload))
    vi.stubGlobal('fetch', fetchMock)

    const result = await postGasRequest(EXEC_URL, { a: 1 }, OPTIONS)

    expect(result).toEqual({ data: payload, ok: true, status: 200 })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(firstResponse.body.cancel).toHaveBeenCalledOnce()

    const [firstRequestInit, secondCall] = [
      fetchMock.mock.calls[0][1],
      fetchMock.mock.calls[1],
    ]
    const [secondUrl, secondRequestInit] = secondCall
    expect(String(secondUrl)).toBe(SECOND_HOP_URL)
    expect(secondRequestInit.method).toBeUndefined()
    expect(secondRequestInit.body).toBeUndefined()
    expect(secondRequestInit.redirect).toBe('follow')
    expect(secondRequestInit.signal).toBe(firstRequestInit.signal)
  })

  test('reports the status of the second hop when that one fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(redirectResponse(SECOND_HOP_URL))
        .mockResolvedValueOnce(jsonResponse(null, 404)),
    )

    const result = await postGasRequest(EXEC_URL, {}, OPTIONS)

    expect(result.ok).toBe(false)
    expect(result.status).toBe(404)
  })

  test('returns a redirect without a Location as it is', async () => {
    const fetchMock = vi.fn().mockResolvedValue(redirectResponse(null))
    vi.stubGlobal('fetch', fetchMock)

    const result = await postGasRequest(EXEC_URL, {}, OPTIONS)

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(result).toEqual({ data: null, ok: false, status: 302 })
  })

  test('returns a redirect with an unreadable Location as it is', async () => {
    const fetchMock = vi.fn().mockResolvedValue(redirectResponse('http://['))
    vi.stubGlobal('fetch', fetchMock)

    const result = await postGasRequest(EXEC_URL, {}, OPTIONS)

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(result).toEqual({ data: null, ok: false, status: 302 })
  })

  test('logs each hop with its status, and never the URLs', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(redirectResponse(SECOND_HOP_URL))
        .mockResolvedValueOnce(jsonResponse({ ok: true })),
    )

    await postGasRequest(EXEC_URL, {}, OPTIONS)

    const lines = loggedLines()
    expect(lines).toHaveLength(2)
    expect(lines[0]).toMatch(/^\[gas\] magic-link hop 1 POST → 302 \(\d+ ms\)$/)
    expect(lines[1]).toMatch(
      /^\[gas\] magic-link hop 2 GET script\.googleusercontent\.com → 200 \(\d+ ms\)$/,
    )
    expect(lines.join()).not.toContain('deployment-id')
    expect(lines.join()).not.toContain('private-key')
  })

  test('warns about a hop that answers an error status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(null, 404)))

    await postGasRequest(EXEC_URL, {}, OPTIONS)

    expect(console.warn).toHaveBeenCalledOnce()
    expect(vi.mocked(console.warn).mock.calls[0][0]).toContain(
      'hop 1 POST → 404',
    )
  })

  test('names the hop that threw, then propagates', async () => {
    const timeout = new DOMException('timed out', 'TimeoutError')
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(redirectResponse(SECOND_HOP_URL))
        .mockRejectedValueOnce(timeout),
    )

    await expect(postGasRequest(EXEC_URL, {}, OPTIONS)).rejects.toBe(timeout)

    expect(vi.mocked(console.warn).mock.calls[0][0]).toMatch(
      /hop 2 GET script\.googleusercontent\.com threw TimeoutError/,
    )
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

    const result = await postGasRequest(EXEC_URL, {}, OPTIONS)

    expect(result).toEqual({ data: null, ok: true, status: 200 })
  })

  test('reflects a non-2xx status with ok: false', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ ok: false }, 500)),
    )

    const result = await postGasRequest(EXEC_URL, {}, OPTIONS)

    expect(result.ok).toBe(false)
    expect(result.status).toBe(500)
  })

  test('propagates when fetch rejects (network / timeout)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')))

    await expect(postGasRequest(EXEC_URL, {}, OPTIONS)).rejects.toThrow('boom')
  })

  test('aborts after 8 s by default and after the given timeout otherwise', async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ ok: true })),
    )

    await postGasRequest(EXEC_URL, {}, OPTIONS)
    await postGasRequest(
      EXEC_URL,
      {},
      {
        ...OPTIONS,
        timeoutMilliseconds: 60_000,
      },
    )

    expect(timeoutSpy.mock.calls).toEqual([[8000], [60_000]])
  })
})
