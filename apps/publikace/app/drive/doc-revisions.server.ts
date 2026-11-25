import type { ArticleStore, DocCheckTarget } from '../data/articles.server.ts'
import type { ArtworkFiles } from './artwork-files.server.ts'

/**
 * Whether the Doc of an approved article was edited after its PDF (#101, `01a`): a revision of
 * its text later than the baseline, the Doc's `modifiedTime` just before the export. A fresh PDF
 * is not compared with the stored one: Google's renderer changes now and then, and every export
 * then hashes differently. Comments, renames and sharing move `modifiedTime` but make no
 * revision, so `modifiedTime` only says whether the revisions are worth listing.
 *
 * The issue detail asks once it stands, from its page (`12q`). What Drive said is recorded on the
 * marking, and a Drive that does not answer records nothing: the page shows what was found before.
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

/**
 * What a check of every target changed, by article: `revised` turned _Upraveno po schválení_
 * now, `moved` already was and found a newer revision, which changes only the day on its row.
 * A revision only ever adds up, so nothing goes back to _Schváleno_.
 */
export type DocChecks = { moved: number[]; revised: number[] }

/** Every target at once: one `files.get` each, the revisions only where the Doc moved. */
export async function checkAllDocRevisions(
  deps: DocRevisionsDeps,
  targets: readonly DocCheckTarget[],
): Promise<DocChecks> {
  let checks = await Promise.all(targets.map((target) => checkDocRevisions(deps, target)))
  let found: DocChecks = { moved: [], revised: [] }
  targets.forEach((target, index) => {
    let check = checks[index]
    if (check === undefined || typeof check === 'string' || check.revisedAt === null) return
    if (target.revisedAt === null) found.revised.push(target.articleId)
    else if (Temporal.Instant.compare(check.revisedAt, target.revisedAt) > 0) {
      found.moved.push(target.articleId)
    }
  })
  return found
}
