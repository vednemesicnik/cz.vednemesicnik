import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ARTICLE_BACKUP_TTL_DAYS,
  type ArticleBackup,
  clearArticleBackup,
  getArticleBackupKey,
  pruneArticleBackups,
  readArticleBackup,
  sanitizeArticleBackupValue,
  writeArticleBackup,
} from './article-backup'

// Minimal in-memory localStorage so the util can run under the node test
// environment without pulling in jsdom.
const createStorageStub = () => {
  const store = new Map<string, string>()

  return {
    clear: () => {
      store.clear()
    },
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => [...store.keys()][index] ?? null,
    get length() {
      return store.size
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
  }
}

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

let storage: ReturnType<typeof createStorageStub>

beforeEach(() => {
  storage = createStorageStub()
  vi.stubGlobal('window', { localStorage: storage })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getArticleBackupKey', () => {
  it('builds the new-article key without an id', () => {
    expect(getArticleBackupKey()).toBe('article-backup:new')
  })

  it('builds the edit-article key from an id', () => {
    expect(getArticleBackupKey('abc123')).toBe('article-backup:abc123')
  })
})

describe('readArticleBackup — TTL', () => {
  const key = getArticleBackupKey('article')

  it('returns a fresh backup', () => {
    const backup: ArticleBackup = {
      savedAt: daysAgo(1),
      value: { title: 'Draft' },
    }
    writeArticleBackup(key, backup)

    expect(readArticleBackup(key)).toEqual(backup)
  })

  it('drops and removes an expired backup', () => {
    writeArticleBackup(key, {
      savedAt: daysAgo(ARTICLE_BACKUP_TTL_DAYS + 1),
      value: { title: 'Old' },
    })

    expect(readArticleBackup(key)).toBeNull()
    expect(storage.getItem(key)).toBeNull()
  })

  it('drops a backup with an unparseable timestamp', () => {
    storage.setItem(key, JSON.stringify({ savedAt: 'not-a-date', value: {} }))

    expect(readArticleBackup(key)).toBeNull()
  })

  it('returns null for a missing key', () => {
    expect(readArticleBackup(getArticleBackupKey('missing'))).toBeNull()
  })
})

describe('pruneArticleBackups', () => {
  it('removes expired and invalid entries but keeps fresh and foreign keys', () => {
    writeArticleBackup(getArticleBackupKey('fresh'), {
      savedAt: daysAgo(1),
      value: {},
    })
    storage.setItem(
      getArticleBackupKey('stale'),
      JSON.stringify({
        savedAt: daysAgo(ARTICLE_BACKUP_TTL_DAYS + 2),
        value: {},
      }),
    )
    storage.setItem(getArticleBackupKey('broken'), '{ not json')
    storage.setItem('unrelated-key', 'keep me')

    pruneArticleBackups()

    expect(storage.getItem(getArticleBackupKey('fresh'))).not.toBeNull()
    expect(storage.getItem(getArticleBackupKey('stale'))).toBeNull()
    expect(storage.getItem(getArticleBackupKey('broken'))).toBeNull()
    expect(storage.getItem('unrelated-key')).toBe('keep me')
  })

  it('runs as a side effect of writing, clearing other stale keys', () => {
    storage.setItem(
      getArticleBackupKey('stale'),
      JSON.stringify({
        savedAt: daysAgo(ARTICLE_BACKUP_TTL_DAYS + 2),
        value: {},
      }),
    )

    writeArticleBackup(getArticleBackupKey('new'), {
      savedAt: daysAgo(0),
      value: {},
    })

    expect(storage.getItem(getArticleBackupKey('stale'))).toBeNull()
  })
})

describe('sanitizeArticleBackupValue', () => {
  it('drops the csrf token', () => {
    const result = sanitizeArticleBackupValue({ csrf: 'token', title: 'A' })
    expect(result).toEqual({ title: 'A' })
  })

  it('strips file fields from images and existingImages', () => {
    const result = sanitizeArticleBackupValue({
      existingImages: [{ altText: 'y', file: new File([], 'b.png'), id: '1' }],
      images: [{ altText: 'x', description: 'd', file: new File([], 'a.png') }],
      title: 'A',
    })

    expect(result).toEqual({
      existingImages: [{ altText: 'y', id: '1' }],
      images: [{ altText: 'x', description: 'd' }],
      title: 'A',
    })
  })

  it('leaves values without image lists untouched', () => {
    const result = sanitizeArticleBackupValue({ slug: 'a', title: 'A' })
    expect(result).toEqual({ slug: 'a', title: 'A' })
  })
})

describe('clearArticleBackup', () => {
  it('removes the stored backup', () => {
    const key = getArticleBackupKey('article')
    writeArticleBackup(key, { savedAt: daysAgo(0), value: {} })

    clearArticleBackup(key)

    expect(storage.getItem(key)).toBeNull()
  })
})
