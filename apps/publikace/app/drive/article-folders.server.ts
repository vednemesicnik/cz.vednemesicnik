import type { ArticleRow, ArticleStore } from '../data/articles.server.ts'
import type { GroupStore } from '../data/artwork-groups.server.ts'
import type { ArticleFolderKind } from '../domain/article-folders.ts'
import type { HolderKind } from '../domain/artwork.ts'
import type { DriveFolders, FolderStanding } from './folders.server.ts'

/**
 * Whether an article's folder and the two inside it are where the app left them, and the record
 * of it on the article (`12j`, `2kig3d8m`). An artwork group has the same three folders and the
 * same record, kept on the group (#133). Every place that runs into a folder asks here: the
 * link's page and its upload and send, _Poslat žádost znovu_, _Zahodit dávku_, the issue detail
 * and _Zkontrolovat znovu_. A folder found missing is marked, one found again loses its mark, and
 * none is ever created again.
 */

export type ArticleFoldersDeps = {
  articles: Pick<ArticleStore, 'clearMissing' | 'markMissing'>
  folders: DriveFolders
  /** Where a group's record goes; only the checks that may meet a group pass it. */
  groups?: Pick<GroupStore, 'clearMissing' | 'markMissing'>
  now(): Temporal.Instant
}

/**
 * An article's folders or a group's. `kind` is never left to a default: an article and a group
 * can share an ID, and a mark recorded on the wrong one would go unseen.
 */
export type ArticleFolderIds = Pick<
  ArticleRow,
  'artworksFolderId' | 'folderId' | 'id' | 'licencesFolderId'
> & { kind: HolderKind }

export type FolderCheck = { missing: ArticleFolderKind[] } | 'unavailable'

export const ALL_FOLDERS: readonly ArticleFolderKind[] = ['article', 'artworks', 'licences']

function idOf(article: ArticleFolderIds, kind: ArticleFolderKind): string | null {
  if (kind === 'article') return article.folderId
  return kind === 'artworks' ? article.artworksFolderId : article.licencesFolderId
}

/**
 * The folders of `which` that are missing. Missing is deleted, off the shared drive, or in the
 * bin. With the article's folder in the bin, a folder inside it counts only when it is missing on
 * its own, deleted or put in the bin itself: one that is there only with its parent comes back
 * with it, and naming it would ask for a step that restoring the parent already does. When Drive
 * does not answer for one of them, nothing is recorded.
 */
export async function checkArticleFolders(
  deps: ArticleFoldersDeps,
  article: ArticleFolderIds,
  which: readonly ArticleFolderKind[] = ALL_FOLDERS,
): Promise<FolderCheck> {
  let kinds = ALL_FOLDERS.filter((kind) => which.includes(kind) || kind === 'article')
  let standings = new Map<ArticleFolderKind, FolderStanding>()
  for (let kind of kinds) {
    let id = idOf(article, kind)
    standings.set(kind, id === null ? 'gone' : await deps.folders.standing(id))
  }
  if ([...standings.values()].includes('unavailable')) return 'unavailable'

  let isArticleMissing = standings.get('article') !== 'exists'
  let missing = kinds.filter((kind) => {
    let standing = standings.get(kind)
    if (kind === 'article') return isArticleMissing
    return isArticleMissing ? standing === 'gone' : standing !== 'exists'
  })
  let found = kinds.filter((kind) => !missing.includes(kind))
  let record = article.kind === 'group' ? deps.groups : deps.articles
  if (record === undefined) throw new Error('A group was checked without the groups store.')
  if (missing.length > 0) await record.markMissing(article.id, missing, deps.now())
  if (found.length > 0) await record.clearMissing(article.id, found)
  return { missing }
}

/** The kinds an article has on record as missing. */
export function recordedMissing(article: Pick<ArticleRow, 'missing'>): ArticleFolderKind[] {
  return ALL_FOLDERS.filter((kind) => article.missing[kind] !== null)
}
