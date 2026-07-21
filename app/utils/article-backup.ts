// Client-side draft backups for the article forms, persisted to localStorage so
// work survives an accidental tab close, reload, or expired session. All access
// is best-effort: localStorage can throw (private mode, exceeded quota) and must
// never break the form.

export type ArticleBackup = {
  value: Record<string, unknown>
  savedAt: string // ISO timestamp
}

const KEY_PREFIX = 'article-backup:'

export const ARTICLE_BACKUP_TTL_DAYS = 7

const ttlMilliseconds = ARTICLE_BACKUP_TTL_DAYS * 24 * 60 * 60 * 1000

export const getArticleBackupKey = (articleId?: string) =>
  `${KEY_PREFIX}${articleId ?? 'new'}`

const isExpired = (savedAt: string) => {
  const timestamp = Date.parse(savedAt)
  return Number.isNaN(timestamp) || Date.now() - timestamp > ttlMilliseconds
}

const stripFileFields = (list: unknown) => {
  if (!Array.isArray(list)) return list

  return list.map((item) => {
    if (item === null || typeof item !== 'object') return item
    // File objects don't survive JSON — drop them so a restore never feeds a
    // non-File value back into Conform (which would fail the instanceof File
    // check on submit). Selected images are re-picked after a restore.
    const { file: _file, ...rest } = item as Record<string, unknown>
    return rest
  })
}

// Prepares a form value for storage: drops data that can't be round-tripped
// through localStorage — the CSRF token (the form renders a fresh one) and image
// File objects on the images / existingImages field lists.
export const sanitizeArticleBackupValue = (
  value: Record<string, unknown>,
): Record<string, unknown> => {
  const { csrf: _csrf, ...rest } = value

  if (rest.images !== undefined) rest.images = stripFileFields(rest.images)
  if (rest.existingImages !== undefined) {
    rest.existingImages = stripFileFields(rest.existingImages)
  }

  return rest
}

// Remove stale backups left behind by drafts that were published, deleted, or
// abandoned elsewhere, so localStorage doesn't accumulate them indefinitely.
export const pruneArticleBackups = () => {
  if (typeof window === 'undefined') return

  try {
    const staleKeys: string[] = []

    for (let index = 0; index < window.localStorage.length; index++) {
      const key = window.localStorage.key(index)
      if (key === null || !key.startsWith(KEY_PREFIX)) continue

      const raw = window.localStorage.getItem(key)
      if (raw === null) continue

      try {
        const backup = JSON.parse(raw) as ArticleBackup
        if (isExpired(backup.savedAt)) staleKeys.push(key)
      } catch {
        staleKeys.push(key)
      }
    }

    // Collect first, then remove: removing during index iteration reshuffles keys.
    for (const key of staleKeys) window.localStorage.removeItem(key)
  } catch {
    // Best-effort: ignore storage failures.
  }
}

export const readArticleBackup = (key: string): ArticleBackup | null => {
  if (typeof window === 'undefined') return null

  // Reading happens on form mount — a good moment to clear stale backups too.
  pruneArticleBackups()

  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return null

    const backup = JSON.parse(raw) as ArticleBackup
    if (isExpired(backup.savedAt)) {
      window.localStorage.removeItem(key)
      return null
    }

    return backup
  } catch {
    return null
  }
}

export const clearArticleBackup = (key: string) => {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.removeItem(key)
  } catch {
    // Best-effort: ignore storage failures.
  }
}

export const writeArticleBackup = (key: string, backup: ArticleBackup) => {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(key, JSON.stringify(backup))
    pruneArticleBackups()
  } catch {
    // Best-effort: ignore storage failures (quota, private mode).
  }
}
