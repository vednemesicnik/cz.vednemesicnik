/**
 * Reads the editorial-board contacts from the Google Apps Script web app (see
 * the SCRIPT__Editorial_Board__Contacts repo). Mirrors the magic-link helper:
 * a secret-protected POST that never throws into the loader — every failure
 * mode resolves to `null`, and the /redakce page renders a fallback message.
 *
 * Stale-while-revalidate: a fresh in-memory cache (TTL ~10 min) is served
 * directly; a stale cache or a last-good JSON snapshot on disk (survives
 * restarts) is served immediately while a background refresh reloads from
 * Google. Only the very first run with no snapshot awaits the fetch. A Google
 * outage or a broken sheet keeps serving the last good data.
 *
 * No-ops when GAS_EDITORIAL_BOARD_URL / GAS_EDITORIAL_BOARD_SECRET are unset
 * (local development): logs a line and returns `null`.
 */

import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { remember } from '@epic-web/remember'
import { z } from 'zod'

// Fail fast if GAS hangs: a slow fetch must not stall the page render.
const GAS_TIMEOUT_MS = 8000

// Low-churn data (changes a few times a year), so a generous TTL is fine.
const CACHE_TTL_MS = 10 * 60 * 1000

const SNAPSHOT_FILE_NAME = 'editorial-board-snapshot.json'

const positionSchema = z.object({
  label: z.string(),
  members: z.array(z.string()),
  order: z.number(),
})

// The endpoint always answers HTTP 200 (GAS ContentService), so `ok: true` is
// the only success signal; `{ ok: false }` and anything malformed are failures.
const responseSchema = z.object({
  ok: z.literal(true),
  positions: z.array(positionSchema),
})

// The persisted snapshot stores just the payload (no `ok` wrapper).
const snapshotSchema = z.object({
  positions: z.array(positionSchema),
})

export type EditorialBoardPosition = z.infer<typeof positionSchema>
export type EditorialBoardData = z.infer<typeof snapshotSchema>

type CacheEntry = { data: EditorialBoardData; fetchedAt: number }

// The loader gets the immediately-servable data plus, when it kicked off a
// background refresh, the shared promise of the fresh GAS data. React Router
// streams `refreshed` so the page can re-render once it settles. `refreshed` is
// `null` whenever no refresh was started (fresh cache, unconfigured, or the
// cold-start awaited fetch).
export type EditorialBoardResult = {
  current: EditorialBoardData | null
  refreshed: Promise<EditorialBoardData | null> | null
}

// Czech collation for member names, resolved once at module scope. Node ships
// full ICU, so this yields correct Czech ordering (č/ř/š/ž), which GAS's limited
// Intl can't guarantee; the endpoint returns members in sheet order and we sort
// here. `Intl.Collator#compare` is a bound function, cached here to avoid
// re-reading it per position.
const compareMembers = new Intl.Collator('cs').compare

const sortMembers = (data: EditorialBoardData): EditorialBoardData => ({
  positions: data.positions.map((position) => ({
    ...position,
    members: [...position.members].sort(compareMembers),
  })),
})

// Absolute path of the snapshot, next to the SQLite DB file. Derived from
// DATABASE_URL (e.g. "file:./data/sqlite.db" → "./data/…json"). Returns null
// when DATABASE_URL is unset so snapshot persistence is skipped rather than
// throwing.
const getSnapshotPath = (): string | null => {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    return null
  }

  const dbFilePath = databaseUrl.replace(/^file:/, '')

  return path.join(path.dirname(dbFilePath), SNAPSHOT_FILE_NAME)
}

const fetchFromGas = async (
  url: string,
  secret: string,
): Promise<EditorialBoardData | null> => {
  try {
    const response = await fetch(url, {
      body: JSON.stringify({ secret }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      signal: AbortSignal.timeout(GAS_TIMEOUT_MS),
    })

    const json = await response.json().catch(() => null)
    const parsed = responseSchema.safeParse(json)

    if (!response.ok || !parsed.success) {
      console.error(
        `[editorial-board] GAS fetch failed — status ${response.status}, valid ${parsed.success}.`,
      )
      return null
    }

    return sortMembers({ positions: parsed.data.positions })
  } catch (error) {
    console.error('[editorial-board] GAS request threw —', error)
    return null
  }
}

const readSnapshot = async (): Promise<EditorialBoardData | null> => {
  const snapshotPath = getSnapshotPath()

  if (!snapshotPath) {
    return null
  }

  try {
    const raw = await fs.readFile(snapshotPath, 'utf8')
    const parsed = snapshotSchema.safeParse(JSON.parse(raw))

    return parsed.success ? sortMembers(parsed.data) : null
  } catch {
    // No snapshot yet (cold start) or unreadable — nothing to fall back to.
    return null
  }
}

const writeSnapshot = async (data: EditorialBoardData): Promise<void> => {
  const snapshotPath = getSnapshotPath()

  if (!snapshotPath) {
    return
  }

  // Best-effort: a persistence failure must never surface into the page.
  // Write to a unique temp file and rename over the target so a crash mid-write
  // can't leave a truncated snapshot and lose the last-good fallback (rename is
  // atomic on the same filesystem).
  const tempPath = `${snapshotPath}.${randomUUID()}.tmp`

  try {
    await fs.mkdir(path.dirname(snapshotPath), { recursive: true })
    await fs.writeFile(tempPath, JSON.stringify(data), 'utf8')
    await fs.rename(tempPath, snapshotPath)
  } catch (error) {
    console.error('[editorial-board] snapshot write failed —', error)
    await fs.rm(tempPath, { force: true }).catch(() => {})
  }
}

export const createEditorialBoardSource = () => {
  let cache: CacheEntry | null = null
  let refreshPromise: Promise<EditorialBoardData | null> | null = null

  // Reloads from GAS, returning the fresh data on success and `null` on failure.
  // Keeps updating the cache / snapshot on success and bumping the TTL on
  // failure — the refresh semantics are unchanged; it just reports the outcome.
  const reloadFromGas = async (
    url: string,
    secret: string,
  ): Promise<EditorialBoardData | null> => {
    const startedAt = Date.now()
    const fetched = await fetchFromGas(url, secret)

    if (fetched) {
      cache = { data: fetched, fetchedAt: Date.now() }
      await writeSnapshot(fetched)
      // A successful refresh is otherwise silent; log it so production
      // (short-lived `fly logs`) can confirm refreshes actually complete.
      console.info(`[editorial-board] refreshed in ${Date.now() - startedAt}ms`)
      return fetched
    }

    if (cache) {
      // Google outage: bump the TTL so we don't re-fetch on every request —
      // next attempt after one TTL (preserves today's bounded-retry behavior).
      cache = { ...cache, fetchedAt: Date.now() }
    }

    return null
  }

  // Deduped background reload: returns the shared in-flight promise so
  // concurrent visitors and the loader all await a single GAS fetch. Never
  // rejects — resolves to `null` on any failure — so callers can serve stale
  // data and stream the promise without a try/catch.
  const refreshInBackground = (
    url: string,
    secret: string,
  ): Promise<EditorialBoardData | null> => {
    if (refreshPromise) return refreshPromise // a refresh is already in flight

    refreshPromise = reloadFromGas(url, secret)
      .catch(() => null) // fetchFromGas never throws, but guard against surprises
      .finally(() => {
        refreshPromise = null
      })

    return refreshPromise
  }

  const getEditorialBoard = async (): Promise<EditorialBoardResult> => {
    const now = Date.now()

    // 1. Fresh cache → immediate, no refresh.
    if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
      return { current: cache.data, refreshed: null }
    }

    const url = process.env.GAS_EDITORIAL_BOARD_URL
    const secret = process.env.GAS_EDITORIAL_BOARD_SECRET

    // GAS not configured → serve the fallback (log + null).
    if (!url || !secret) {
      if (process.env.NODE_ENV === 'production') {
        console.warn(
          '[editorial-board] GAS_EDITORIAL_BOARD_URL/SECRET not set — serving fallback.',
        )
      } else {
        console.info(
          '[editorial-board] GAS not configured — /redakce will show the fallback message.',
        )
      }
      return { current: null, refreshed: null }
    }

    // 2. Stale in-memory cache → serve immediately, stream the background refresh.
    if (cache) {
      return {
        current: cache.data,
        refreshed: refreshInBackground(url, secret),
      }
    }

    // 3. Cold start → fast local snapshot read. Seed the cache as stale
    //    (fetchedAt: 0), serve immediately, stream the background refresh.
    const snapshot = await readSnapshot()

    if (snapshot) {
      cache = { data: snapshot, fetchedAt: 0 }
      return { current: snapshot, refreshed: refreshInBackground(url, secret) }
    }

    // 4. Nothing at all (first run, no snapshot) → awaited fetch. Stamp the
    //    cache from the fetch completion time, not the request start — a slow
    //    fetch (up to the timeout) must not make the entry expire early.
    const fetched = await fetchFromGas(url, secret)

    if (fetched) {
      cache = { data: fetched, fetchedAt: Date.now() }
      await writeSnapshot(fetched)
      return { current: fetched, refreshed: null }
    }

    return { current: null, refreshed: null }
  }

  return { getEditorialBoard }
}

// Single instance shared across requests (and preserved over dev HMR reloads,
// like the Prisma client) so the cache actually persists.
const editorialBoardSource = remember(
  'editorialBoardSource',
  createEditorialBoardSource,
)

export const getEditorialBoard = editorialBoardSource.getEditorialBoard
