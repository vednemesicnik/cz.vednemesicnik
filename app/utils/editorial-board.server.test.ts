import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createEditorialBoardSource } from './editorial-board.server'

const GAS_URL = 'https://example.test/exec'
const GAS_SECRET = 'test-secret'
const CACHE_TTL_MS = 10 * 60 * 1000

const positions = [
  { label: 'Role A', members: ['Member One', 'Member Two'], order: 1 },
  { label: 'Role B', members: [], order: 2 },
]

const validResponse = { ok: true, positions }

// Minimal stand-in for the fetch Response the util consumes (status + json()).
const jsonResponse = (json: unknown, status = 200) => ({
  json: async () => json,
  ok: status >= 200 && status < 300,
  status,
})

// A promise whose resolution is controlled by the test — used to keep a
// background fetch pending while asserting that stale data is served without it.
type Deferred<Value> = {
  promise: Promise<Value>
  resolve: (value: Value) => void
}

const createDeferred = <Value>(): Deferred<Value> => {
  let resolve!: (value: Value) => void
  const promise = new Promise<Value>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

// Drains the microtask queue so a fire-and-forget background refresh can settle
// (update the cache / bump the TTL) before the following assertion runs.
const flushMicrotasks = async () => {
  for (let iteration = 0; iteration < 10; iteration += 1) {
    await Promise.resolve()
  }
}

let tmpDir: string
let originalDatabaseUrl: string | undefined

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'editorial-board-'))
  originalDatabaseUrl = process.env.DATABASE_URL
  process.env.DATABASE_URL = `file:${path.join(tmpDir, 'sqlite.db')}`
  process.env.GAS_EDITORIAL_BOARD_URL = GAS_URL
  process.env.GAS_EDITORIAL_BOARD_SECRET = GAS_SECRET

  // Keep the test output clean — the util logs on every failure path.
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
})

afterEach(async () => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  // A fire-and-forget background refresh may still be writing a snapshot into
  // tmpDir as the test ends; retry the removal so that race can't fail cleanup.
  await fs.rm(tmpDir, {
    force: true,
    maxRetries: 10,
    recursive: true,
    retryDelay: 20,
  })

  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl
  }
  delete process.env.GAS_EDITORIAL_BOARD_URL
  delete process.env.GAS_EDITORIAL_BOARD_SECRET
})

describe('getEditorialBoard', () => {
  test('returns the parsed positions and posts the secret on a valid response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(validResponse))
    vi.stubGlobal('fetch', fetchMock)

    const { getEditorialBoard } = createEditorialBoardSource()
    const result = await getEditorialBoard()

    // First run with no snapshot awaits the fetch, so there is nothing to stream.
    expect(result.current).toEqual({ positions })
    expect(result.refreshed).toBeNull()
    expect(fetchMock).toHaveBeenCalledOnce()

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(GAS_URL)
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ secret: GAS_SECRET })
  })

  test('orders each section members by Czech collation', async () => {
    // Sheet order, mixing diacritics: cs collation must place Č after C and Ž
    // last — a naive code-unit sort would order Č/Ž after all ASCII letters.
    const unordered = {
      ok: true,
      positions: [
        {
          label: 'Role A',
          members: ['Žák', 'Dvořák', 'Čáp', 'Cimrman'],
          order: 1,
        },
      ],
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(unordered)))

    const { getEditorialBoard } = createEditorialBoardSource()
    const result = await getEditorialBoard()

    expect(result.current?.positions[0].members).toEqual([
      'Cimrman',
      'Čáp',
      'Dvořák',
      'Žák',
    ])
  })

  test('rejects an { ok: false } response as a failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ ok: false })),
    )

    const { getEditorialBoard } = createEditorialBoardSource()

    expect(await getEditorialBoard()).toEqual({
      current: null,
      refreshed: null,
    })
  })

  test('rejects a structurally invalid payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ ok: true, positions: [{ label: 'x' }] }),
        ),
    )

    const { getEditorialBoard } = createEditorialBoardSource()

    expect(await getEditorialBoard()).toEqual({
      current: null,
      refreshed: null,
    })
  })

  test('serves the cache within the TTL with no refresh, re-fetches after it expires', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(validResponse))
    vi.stubGlobal('fetch', fetchMock)

    const { getEditorialBoard } = createEditorialBoardSource()

    await getEditorialBoard()
    // A fresh cache hit serves immediately and streams nothing.
    expect(await getEditorialBoard()).toEqual({
      current: { positions },
      refreshed: null,
    })
    expect(fetchMock).toHaveBeenCalledOnce()

    vi.advanceTimersByTime(CACHE_TTL_MS)

    await getEditorialBoard()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  test('streams the fresh data on a stale cache and updates the cache afterwards', async () => {
    vi.useFakeTimers()
    const newPositions = [
      { label: 'Role C', members: ['Someone New'], order: 1 },
    ]
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(validResponse))
      .mockResolvedValueOnce(
        jsonResponse({ ok: true, positions: newPositions }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const { getEditorialBoard } = createEditorialBoardSource()

    await getEditorialBoard() // prime the cache
    vi.advanceTimersByTime(CACHE_TTL_MS)

    // Stale data is served immediately; the fresh data arrives on `refreshed`.
    const { current, refreshed } = await getEditorialBoard()
    expect(current).toEqual({ positions })
    expect(refreshed).not.toBeNull()
    expect(await refreshed).toEqual({ positions: newPositions })

    // The cache is now updated — a follow-up within the TTL serves the new data.
    expect((await getEditorialBoard()).current).toEqual({
      positions: newPositions,
    })
  })

  test('keeps the stale in-memory value when the background refresh fails', async () => {
    vi.useFakeTimers()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(validResponse))
      .mockRejectedValue(new Error('GAS down'))
    vi.stubGlobal('fetch', fetchMock)

    const { getEditorialBoard } = createEditorialBoardSource()

    await getEditorialBoard()
    vi.advanceTimersByTime(CACHE_TTL_MS)

    // Expiry serves stale immediately; the streamed refresh then resolves to null.
    const { current, refreshed } = await getEditorialBoard()
    expect(current).toEqual({ positions })
    expect(refreshed).not.toBeNull() // a refresh was streamed (not the no-op null)
    expect(await refreshed).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  test('serves the disk snapshot on a fresh instance', async () => {
    // First instance fetches successfully → writes the snapshot to disk.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(validResponse)),
    )
    await createEditorialBoardSource().getEditorialBoard()

    // A fresh instance (empty in-memory cache) serves the persisted snapshot
    // immediately, even while its background refresh fetch fails.
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('GAS down')))

    expect(
      (await createEditorialBoardSource().getEditorialBoard()).current,
    ).toEqual({ positions })
  })

  test('serves stale data immediately on expiry while the fetch is still pending, then updates from the background refresh', async () => {
    vi.useFakeTimers()
    const deferred = createDeferred<ReturnType<typeof jsonResponse>>()
    const newPositions = [
      { label: 'Role C', members: ['Someone New'], order: 1 },
    ]
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(validResponse))
      .mockReturnValueOnce(deferred.promise)
    vi.stubGlobal('fetch', fetchMock)

    const { getEditorialBoard } = createEditorialBoardSource()

    await getEditorialBoard() // prime the cache
    vi.advanceTimersByTime(CACHE_TTL_MS)

    // The refresh fetch never resolves here, yet stale data is returned at once.
    expect((await getEditorialBoard()).current).toEqual({ positions })
    expect(fetchMock).toHaveBeenCalledTimes(2)

    // Once the background fetch resolves, a later call reflects the new data.
    deferred.resolve(jsonResponse({ ok: true, positions: newPositions }))
    await flushMicrotasks()

    expect((await getEditorialBoard()).current).toEqual({
      positions: newPositions,
    })
  })

  test('serves the disk snapshot on cold start without waiting for the fetch', async () => {
    // First instance fetches successfully → writes the snapshot to disk.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(validResponse)),
    )
    await createEditorialBoardSource().getEditorialBoard()

    // Fresh instance with a fetch that never resolves: the snapshot is served
    // immediately and a background refresh was still started.
    const deferred = createDeferred<ReturnType<typeof jsonResponse>>()
    const fetchMock = vi.fn().mockReturnValue(deferred.promise)
    vi.stubGlobal('fetch', fetchMock)

    const { current, refreshed } =
      await createEditorialBoardSource().getEditorialBoard()
    expect(current).toEqual({ positions })
    expect(refreshed).not.toBeNull()
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  test('concurrent requests after expiry share one refresh promise and trigger exactly one GAS fetch', async () => {
    vi.useFakeTimers()
    const deferred = createDeferred<ReturnType<typeof jsonResponse>>()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(validResponse))
      .mockReturnValueOnce(deferred.promise)
    vi.stubGlobal('fetch', fetchMock)

    const { getEditorialBoard } = createEditorialBoardSource()

    await getEditorialBoard() // prime the cache
    vi.advanceTimersByTime(CACHE_TTL_MS)

    const [first, second] = await Promise.all([
      getEditorialBoard(),
      getEditorialBoard(),
    ])

    expect(first.current).toEqual({ positions })
    expect(second.current).toEqual({ positions })
    // Both callers share the very same deduped in-flight promise.
    expect(first.refreshed).toBe(second.refreshed)
    // One prime fetch + a single deduped background refresh.
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  test('does not re-fetch on the request after a failed background refresh (TTL bumped)', async () => {
    vi.useFakeTimers()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(validResponse))
      .mockRejectedValue(new Error('GAS down'))
    vi.stubGlobal('fetch', fetchMock)

    const { getEditorialBoard } = createEditorialBoardSource()

    await getEditorialBoard() // prime (fetch #1)
    vi.advanceTimersByTime(CACHE_TTL_MS)

    const { current, refreshed } = await getEditorialBoard() // background fetch #2
    expect(current).toEqual({ positions })
    expect(refreshed).not.toBeNull() // a refresh was streamed (not the no-op null)
    expect(await refreshed).toBeNull() // failed refresh resolves to null, bumps TTL
    expect(fetchMock).toHaveBeenCalledTimes(2)

    // The TTL was bumped, so an immediate follow-up hits the fresh cache.
    expect(await getEditorialBoard()).toEqual({
      current: { positions },
      refreshed: null,
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  test('returns null and never fetches when the env vars are unset', async () => {
    delete process.env.GAS_EDITORIAL_BOARD_URL
    delete process.env.GAS_EDITORIAL_BOARD_SECRET

    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { getEditorialBoard } = createEditorialBoardSource()

    expect(await getEditorialBoard()).toEqual({
      current: null,
      refreshed: null,
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
