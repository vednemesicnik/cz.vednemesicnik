import type { ArticleStore, DocCheckTarget } from '../data/articles.server.ts'
import type { ArtworkFiles } from './artwork-files.server.ts'

/**
 * Whether the Doc of an approved article was edited after its PDF (#101, `01a`): a revision of
 * its text later than the baseline, the Doc's `modifiedTime` just before the export. A fresh PDF
 * is not compared with the stored one: Google's renderer changes now and then, and every export
 * then hashes differently. Comments, renames and sharing move `modifiedTime` but make no
 * revision, so `modifiedTime` only says whether the revisions are worth listing.
 *
 * The issue detail asks when it opens. What Drive said is recorded on the marking, and a Drive
 * that does not answer records nothing: the page shows what was found before.
 */

export type DocRevisionsDeps = {
  articles: Pick<ArticleStore, 'recordDocCheck'>
  files: Pick<ArtworkFiles, 'placeOf' | 'revisionTimesOf'>
}

/**
 * What one check found: `unchanged` when the Doc did not move since the last check, else the
 * newest revision after the baseline, if any. `unavailable` recorded nothing.
 */
export type DocCheck = { revisedAt: Temporal.Instant | null } | 'unavailable' | 'unchanged'

export async function checkDocRevisions(
  deps: DocRevisionsDeps,
  target: DocCheckTarget,
): Promise<DocCheck> {
  let place = await deps.files.placeOf(target.docId)
  /* A Doc that is gone has nothing newer to say; the PDF the authors agreed to stands. */
  if (place.kind !== 'here') return 'unavailable'
  let modifiedAt = place.modifiedAt
  if (modifiedAt === null || Temporal.Instant.compare(modifiedAt, target.checkedAt) <= 0) {
    return 'unchanged'
  }
  let times = await deps.files.revisionTimesOf(target.docId)
  if (times === null) return 'unavailable'
  let later = times.filter((at) => Temporal.Instant.compare(at, target.baseline) > 0)
  let revisedAt = later.reduce<Temporal.Instant | null>(
    (newest, at) => (newest === null || Temporal.Instant.compare(at, newest) > 0 ? at : newest),
    null,
  )
  await deps.articles.recordDocCheck(target.articleId, target.markedAt, {
    checkedAt: modifiedAt,
    revisedAt,
  })
  return { revisedAt }
}

/** Every target at once: one `files.get` each, the revisions only where the Doc moved. */
export async function checkAllDocRevisions(
  deps: DocRevisionsDeps,
  targets: readonly DocCheckTarget[],
): Promise<void> {
  await Promise.all(targets.map((target) => checkDocRevisions(deps, target)))
}
