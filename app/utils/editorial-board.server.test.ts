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
  await fs.rm(tmpDir, { force: true, recursive: true })

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

    expect(result).toEqual({ positions })
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

    expect(result?.positions[0].members).toEqual([
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

    expect(await getEditorialBoard()).toBeNull()
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

    expect(await getEditorialBoard()).toBeNull()
  })

  test('serves the cache within the TTL and re-fetches after it expires', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(validResponse))
    vi.stubGlobal('fetch', fetchMock)

    const { getEditorialBoard } = createEditorialBoardSource()

    await getEditorialBoard()
    await getEditorialBoard()
    expect(fetchMock).toHaveBeenCalledOnce()

    vi.advanceTimersByTime(CACHE_TTL_MS)

    await getEditorialBoard()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  test('serves the stale in-memory value when a later fetch fails', async () => {
    vi.useFakeTimers()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(validResponse))
      .mockRejectedValue(new Error('GAS down'))
    vi.stubGlobal('fetch', fetchMock)

    const { getEditorialBoard } = createEditorialBoardSource()

    await getEditorialBoard()
    vi.advanceTimersByTime(CACHE_TTL_MS)

    expect(await getEditorialBoard()).toEqual({ positions })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  test('reads the disk snapshot on a fresh instance when the fetch fails', async () => {
    // First instance fetches successfully → writes the snapshot to disk.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(validResponse)),
    )
    await createEditorialBoardSource().getEditorialBoard()

    // A fresh instance (empty in-memory cache) with a failing fetch falls back
    // to the persisted snapshot.
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('GAS down')))

    expect(await createEditorialBoardSource().getEditorialBoard()).toEqual({
      positions,
    })
  })

  test('returns null and never fetches when the env vars are unset', async () => {
    delete process.env.GAS_EDITORIAL_BOARD_URL
    delete process.env.GAS_EDITORIAL_BOARD_SECRET

    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { getEditorialBoard } = createEditorialBoardSource()

    expect(await getEditorialBoard()).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
