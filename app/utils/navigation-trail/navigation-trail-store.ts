import type { TrailRecord } from './navigation-trail-entry'

/** Entries kept, the oldest dropped first: far more than a tab goes back. */
const ENTRY_LIMIT = 100

const STORAGE_KEY = 'navigation-trail'

type Listener = () => void

type Options = {
  readStorage?: () => Storage | null
}

const readSessionStorage = () => {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage
  } catch {
    // Storage blocked (privacy settings): the trail lives in memory.
    return null
  }
}

/**
 * Creates the store of the tab's navigation trail (design 30i, n3wa2ld4):
 * what each history entry, by its key, remembers of the way to it. It is kept
 * in session storage, so a reload and Back and Forward find it again, and it
 * never leaves the tab: nothing goes to the server or to the next visit.
 *
 * It also knows the entry on screen, and the address a delete asked the
 * server to redirect to, which the scroll restoration reads while that
 * redirect is still landing. Neither is stored: both last one navigation.
 *
 * @param options.readStorage - The tab's storage; returning `null` keeps the
 *   trail in memory only. Session storage by default.
 * @returns `get` and `set` a record by entry key, `subscribe`, and
 *   `readCurrentKey` and `setCurrentKey` for the entry on screen, and
 *   `expectRedirect`, `readExpectedRedirect` and `clearExpectedRedirect` for
 *   the redirect a delete asked for.
 */
export const createNavigationTrailStore = ({
  readStorage = readSessionStorage,
}: Options = {}) => {
  let records: Map<string, TrailRecord> | null = null
  let currentKey: string | null = null
  let expectedRedirect: string | null = null
  const listeners = new Set<Listener>()

  const load = () => {
    if (records !== null) return records

    records = new Map()

    try {
      const stored = readStorage()?.getItem(STORAGE_KEY)
      const entries: unknown = stored ? JSON.parse(stored) : []

      if (Array.isArray(entries)) {
        for (const [key, record] of entries) records.set(key, record)
      }
    } catch {
      // An unreadable copy is dropped; the trail starts again.
    }

    return records
  }

  const save = (loaded: Map<string, TrailRecord>) => {
    try {
      readStorage()?.setItem(STORAGE_KEY, JSON.stringify([...loaded]))
    } catch {
      // Storage full or blocked: the memory still holds the trail.
    }
  }

  return {
    clearExpectedRedirect: () => {
      expectedRedirect = null
    },
    expectRedirect: (address: string) => {
      expectedRedirect = address
    },
    get: (key: string) => load().get(key),
    readCurrentKey: () => currentKey,
    readExpectedRedirect: () => expectedRedirect,
    set: (key: string, record: TrailRecord) => {
      const loaded = load()

      loaded.delete(key)
      loaded.set(key, record)

      for (const oldestKey of loaded.keys()) {
        if (loaded.size <= ENTRY_LIMIT) break
        loaded.delete(oldestKey)
      }

      save(loaded)

      for (const listener of listeners) listener()
    },
    setCurrentKey: (key: string) => {
      currentKey = key
    },
    subscribe: (listener: Listener) => {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
  }
}

export type NavigationTrailStore = ReturnType<typeof createNavigationTrailStore>

/** The tab's one navigation trail. */
export const navigationTrailStore = createNavigationTrailStore()
