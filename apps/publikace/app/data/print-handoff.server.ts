import type { Database } from 'remix/data-table'
import { sql } from 'remix/data-table'

import {
  articleFolderTag,
  artworkCopyTag,
  CLAIM_MINUTES,
  groupFolderTag,
  ISSUE_CLAIM_LIMIT,
  type PrintSummary,
  textCopyTag,
} from '../domain/print-handoff.ts'
import { parseStamp, stamp } from '../domain/time.ts'
import { ALL_CLAUSES_APPROVED_F } from './articles.server.ts'

/**
 * The print folders of the issues made in the app as `SCRIPT__Publication__Print_Handoff` fills
 * them (#110): what each one should hold, what the job last reported it holds, and which run
 * holds an issue now.
 */

/** What an article's folder inside the print folder holds, as the job reported it. */
export type ArticleCopy = {
  artworks: { artworkId: number; fileId: string; name: string }[]
  folderId: string
  isTextChanged: boolean
  lastImageNumber: number
  textFileId: string | null
  textFinalVersionId: number | null
}

/**
 * One article as a claim hands it to the job: what belongs in the folder and what is there. An
 * article whose text lost its approval or whose artworks lost their consent still comes with its
 * copy, and the job bins what is no longer wanted.
 */
export type ClaimedArticle = {
  articleId: number
  artworks: {
    artworkId: number
    author: string
    copyTag: string
    fileId: string
    source: string
    storedName: string
  }[]
  copy: ArticleCopy | null
  docId: string
  folderTag: string
  name: string
  sourceFolderId: string
  /**
   * The newest final version every author agreed to. `revisedAfter` is the moment an edit of the
   * Doc stops being in it, `isStanding` false once a newer version was marked: either way the job
   * keeps the copy it has and says in the _Podklady_ sheet that a new approval is awaited.
   */
  text: {
    copyTag: string
    finalVersionId: number
    isStanding: boolean
    revisedAfter: Temporal.Instant
  } | null
}

/** What an artwork group's folder inside the print folder holds, as the job reported it (#133). */
export type GroupCopy = {
  artworks: { artworkId: number; fileId: string; name: string }[]
  folderId: string
  lastImageNumber: number
}

/**
 * One artwork group as a claim hands it to the job (#133): its artworks with consent, and its note
 * for the designer, which goes to the _Podklady_ sheet. A group with no artwork with consent and no
 * copy is left out, so an empty group gets no folder.
 */
export type ClaimedGroup = {
  artworks: ClaimedArticle['artworks']
  copy: GroupCopy | null
  folderTag: string
  groupId: number
  name: string
  note: string
  sourceFolderId: string
}

export type ClaimedIssue = {
  articles: ClaimedArticle[]
  groups: ClaimedGroup[]
  issueId: number
  issueName: string
  printFolderId: string
  sheetId: string | null
}

/** What a run did with one issue. An article left out was not reached and stays as it was. */
export type IssueReport = {
  articles: { articleId: number; copy: ArticleCopy | null }[]
  /** Left out by a job written before groups (#133), which leaves every group as it was. */
  groups?: { copy: GroupCopy | null; groupId: number }[]
  isComplete: boolean
  issueId: number
  sheetId: string | null
}

export type IssueAnswer = 'accepted' | 'unknown'

export type PrintHandoffStore = {
  /**
   * Opens the run's hold on every open, complete issue with a print folder that no other run
   * holds, and returns what each folder should hold beside what it holds.
   */
  claim(runKey: string, at: Temporal.Instant): Promise<ClaimedIssue[]>
  /**
   * Keeps what the run reported for an issue it holds and releases it; `unknown` for an issue the
   * run does not hold. A complete pass moves the issue's last full run to the run's start.
   */
  record(runKey: string, report: IssueReport): Promise<IssueAnswer>
  /** What the issue's folder holds, once a run got through the whole issue (`12t`). */
  summaryOf(issueId: number): Promise<PrintSummary | null>
}

type Row = Record<string, unknown>

function text(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function idsJson(ids: readonly number[]): string {
  return JSON.stringify(ids)
}

async function copiesOf(db: Database, issueIds: string): Promise<Map<number, ArticleCopy>> {
  let articles = await db.exec(
    sql`SELECT * FROM print_articles WHERE issue_id IN (SELECT value FROM json_each(${issueIds}))`,
  )
  let artworks = await db.exec(
    sql`SELECT w.* FROM print_artworks w JOIN print_articles p ON p.article_id = w.article_id
        WHERE p.issue_id IN (SELECT value FROM json_each(${issueIds}))
        ORDER BY w.name`,
  )
  let copies = new Map<number, ArticleCopy>()
  for (let row of articles.rows ?? []) {
    let versionId = row['text_final_version_id']
    copies.set(Number(row['article_id']), {
      artworks: [],
      folderId: String(row['folder_id']),
      isTextChanged: Number(row['is_text_changed']) === 1,
      lastImageNumber: Number(row['last_image_number']),
      textFileId: text(row['text_file_id']),
      textFinalVersionId: versionId === null ? null : Number(versionId),
    })
  }
  for (let row of artworks.rows ?? []) {
    copies.get(Number(row['article_id']))?.artworks.push({
      artworkId: Number(row['artwork_id']),
      fileId: String(row['copy_file_id']),
      name: String(row['name']),
    })
  }
  return copies
}

/**
 * The newest final version of each article that every author agreed to, standing or replaced by
 * a newer one, never a cancelled one.
 */
async function approvedTexts(
  db: Database,
  issueIds: string,
): Promise<Map<number, NonNullable<ClaimedArticle['text']>>> {
  let result = await db.exec(
    sql`SELECT f.id, f.article_id, f.replaced_at, coalesce(f.doc_modified_at, f.marked_at) AS since
        FROM final_versions f JOIN articles a ON a.id = f.article_id
        WHERE a.issue_id IN (SELECT value FROM json_each(${issueIds}))
          AND f.cancelled_at IS NULL AND ${ALL_CLAUSES_APPROVED_F}
        ORDER BY f.marked_at DESC, f.id DESC`,
  )
  let texts = new Map<number, NonNullable<ClaimedArticle['text']>>()
  for (let row of result.rows ?? []) {
    let articleId = Number(row['article_id'])
    let since = parseStamp(row['since'])
    if (texts.has(articleId) || since === null) continue
    let finalVersionId = Number(row['id'])
    texts.set(articleId, {
      copyTag: textCopyTag(articleId, finalVersionId),
      finalVersionId,
      isStanding: row['replaced_at'] === null,
      revisedAfter: since,
    })
  }
  return texts
}

/**
 * The artworks of each article and of each artwork group whose conversation is in `Licence`
 * (`01b` _Schváleno_), keyed `article:<id>` and `group:<id>`.
 */
async function consentedArtworks(
  db: Database,
  issueIds: string,
): Promise<Map<string, ClaimedArticle['artworks']>> {
  let result = await db.exec(
    sql`SELECT a.id, a.article_id, a.group_id, a.drive_file_id, a.stored_name, a.author, a.source
        FROM artworks a JOIN artwork_batches b ON b.id = a.batch_id
        WHERE b.issue_id IN (SELECT value FROM json_each(${issueIds}))
          AND b.created_at IS NOT NULL AND b.discarded_at IS NULL AND b.approved_at IS NOT NULL
          AND a.removed_at IS NULL
        ORDER BY b.created_at, b.id, a.position, a.id`,
  )
  let byHolder = new Map<string, ClaimedArticle['artworks']>()
  for (let row of result.rows ?? []) {
    let holder =
      row['group_id'] == null
        ? `article:${Number(row['article_id'])}`
        : `group:${Number(row['group_id'])}`
    let artworkId = Number(row['id'])
    let list = byHolder.get(holder) ?? []
    list.push({
      artworkId,
      author: text(row['author']) ?? '',
      copyTag: artworkCopyTag(artworkId),
      fileId: String(row['drive_file_id']),
      source: text(row['source']) ?? '',
      storedName: String(row['stored_name']),
    })
    byHolder.set(holder, list)
  }
  return byHolder
}

async function groupCopiesOf(db: Database, issueIds: string): Promise<Map<number, GroupCopy>> {
  let groups = await db.exec(
    sql`SELECT * FROM print_groups WHERE issue_id IN (SELECT value FROM json_each(${issueIds}))`,
  )
  let artworks = await db.exec(
    sql`SELECT w.* FROM print_group_artworks w JOIN print_groups p ON p.group_id = w.group_id
        WHERE p.issue_id IN (SELECT value FROM json_each(${issueIds}))
        ORDER BY w.name`,
  )
  let copies = new Map<number, GroupCopy>()
  for (let row of groups.rows ?? []) {
    copies.set(Number(row['group_id']), {
      artworks: [],
      folderId: String(row['folder_id']),
      lastImageNumber: Number(row['last_image_number']),
    })
  }
  for (let row of artworks.rows ?? []) {
    copies.get(Number(row['group_id']))?.artworks.push({
      artworkId: Number(row['artwork_id']),
      fileId: String(row['copy_file_id']),
      name: String(row['name']),
    })
  }
  return copies
}

/** What the job reported of a group of the issue it holds; a group of another issue is ignored. */
async function recordGroup(
  db: Database,
  issueId: number,
  group: NonNullable<IssueReport['groups']>[number],
): Promise<void> {
  let found = await db.exec(
    sql`SELECT 1 FROM artwork_groups WHERE id = ${group.groupId} AND issue_id = ${issueId}
          AND created_at IS NOT NULL`,
  )
  if ((found.rows ?? []).length === 0) return
  let { copy } = group
  if (copy === null) {
    await db.exec(sql`DELETE FROM print_groups WHERE group_id = ${group.groupId}`)
    return
  }
  await db.exec(
    sql`INSERT INTO print_groups (group_id, issue_id, folder_id, last_image_number)
        VALUES (${group.groupId}, ${issueId}, ${copy.folderId}, ${copy.lastImageNumber})
        ON CONFLICT (group_id) DO UPDATE SET
          folder_id = excluded.folder_id,
          last_image_number = max(last_image_number, excluded.last_image_number)`,
  )
  await db.exec(sql`DELETE FROM print_group_artworks WHERE group_id = ${group.groupId}`)
  if (copy.artworks.length === 0) return
  /* As for an article: one statement, only this group's artworks, the list's order. */
  await db.exec(
    sql`INSERT INTO print_group_artworks (artwork_id, group_id, copy_file_id, name)
        SELECT a.id, ${group.groupId},
          json_extract(c.value, '$.fileId'), json_extract(c.value, '$.name')
        FROM json_each(${JSON.stringify(copy.artworks)}) AS c
        JOIN artworks AS a ON a.id = json_extract(c.value, '$.artworkId')
                          AND a.group_id = ${group.groupId}
        WHERE true
        ORDER BY c.key
        ON CONFLICT (artwork_id) DO NOTHING`,
  )
}

async function recordArticle(
  db: Database,
  issueId: number,
  article: IssueReport['articles'][number],
): Promise<void> {
  let found = await db.exec(
    sql`SELECT 1 FROM articles WHERE id = ${article.articleId} AND issue_id = ${issueId}
          AND created_at IS NOT NULL`,
  )
  if ((found.rows ?? []).length === 0) return
  let { copy } = article
  if (copy === null) {
    await db.exec(sql`DELETE FROM print_articles WHERE article_id = ${article.articleId}`)
    return
  }
  /* A version of another article is not this one's: the copy is kept without it. */
  let version = copy.textFinalVersionId
  if (version !== null) {
    let own = await db.exec(
      sql`SELECT 1 FROM final_versions WHERE id = ${version} AND article_id = ${article.articleId}`,
    )
    if ((own.rows ?? []).length === 0) version = null
  }
  await db.exec(
    sql`INSERT INTO print_articles (article_id, issue_id, folder_id, text_file_id,
          text_final_version_id, is_text_changed, last_image_number)
        VALUES (${article.articleId}, ${issueId}, ${copy.folderId}, ${copy.textFileId},
          ${version}, ${copy.isTextChanged ? 1 : 0}, ${copy.lastImageNumber})
        ON CONFLICT (article_id) DO UPDATE SET
          folder_id = excluded.folder_id, text_file_id = excluded.text_file_id,
          text_final_version_id = excluded.text_final_version_id,
          is_text_changed = excluded.is_text_changed,
          last_image_number = max(last_image_number, excluded.last_image_number)`,
  )
  await db.exec(sql`DELETE FROM print_artworks WHERE article_id = ${article.articleId}`)
  if (copy.artworks.length === 0) return
  /*
   * One statement for all of the article's artworks, so a long list costs one round on the
   * connection every request shares. The join keeps only this article's artworks, and `c.key`
   * keeps the list's order, so a duplicate keeps its first entry.
   */
  await db.exec(
    sql`INSERT INTO print_artworks (artwork_id, article_id, copy_file_id, name)
        SELECT a.id, ${article.articleId},
          json_extract(c.value, '$.fileId'), json_extract(c.value, '$.name')
        FROM json_each(${JSON.stringify(copy.artworks)}) AS c
        JOIN artworks AS a ON a.id = json_extract(c.value, '$.artworkId')
                          AND a.article_id = ${article.articleId}
        WHERE true
        ORDER BY c.key
        ON CONFLICT (artwork_id) DO NOTHING`,
  )
}

export function createPrintHandoffStore(database: Database): PrintHandoffStore {
  return {
    claim(runKey, at) {
      let lease = stamp(at.subtract({ minutes: CLAIM_MINUTES }))
      return database.transaction(async (db) => {
        let open = await db.exec(
          sql`SELECT i.id FROM issues i LEFT JOIN print_handoffs h ON h.issue_id = i.id
              WHERE i.completed_at IS NOT NULL AND i.closed_at IS NULL
                AND i.print_folder_id IS NOT NULL
                AND (h.claimed_at IS NULL OR h.claimed_at < ${lease})
              ORDER BY i.started_at, i.id
              LIMIT ${ISSUE_CLAIM_LIMIT}`,
        )
        let ids = idsJson((open.rows ?? []).map((row) => Number(row['id'])))
        await db.exec(
          sql`INSERT INTO print_handoffs (issue_id)
              SELECT value FROM json_each(${ids}) WHERE true
              ON CONFLICT (issue_id) DO NOTHING`,
        )
        await db.exec(
          sql`UPDATE print_handoffs SET claim_key = ${runKey}, claimed_at = ${stamp(at)}
              WHERE issue_id IN (SELECT value FROM json_each(${ids}))`,
        )
        let issues = await db.exec(
          sql`SELECT i.id, i.name, i.print_folder_id, h.sheet_id
              FROM issues i JOIN print_handoffs h ON h.issue_id = i.id
              WHERE i.id IN (SELECT value FROM json_each(${ids}))
              ORDER BY i.started_at, i.id`,
        )
        let articles = await db.exec(
          sql`SELECT id, issue_id, name, doc_id, folder_id FROM articles
              WHERE issue_id IN (SELECT value FROM json_each(${ids})) AND created_at IS NOT NULL
              ORDER BY started_at, id`,
        )
        let texts = await approvedTexts(db, ids)
        let artworks = await consentedArtworks(db, ids)
        let copies = await copiesOf(db, ids)

        let byIssue = new Map<number, ClaimedArticle[]>()
        for (let row of articles.rows ?? []) {
          let articleId = Number(row['id'])
          let claimed: ClaimedArticle = {
            articleId,
            artworks: artworks.get(`article:${articleId}`) ?? [],
            copy: copies.get(articleId) ?? null,
            docId: String(row['doc_id']),
            folderTag: articleFolderTag(articleId),
            name: String(row['name']),
            sourceFolderId: String(row['folder_id']),
            text: texts.get(articleId) ?? null,
          }
          if (claimed.text === null && claimed.artworks.length === 0 && claimed.copy === null) {
            continue
          }
          let issueId = Number(row['issue_id'])
          byIssue.set(issueId, [...(byIssue.get(issueId) ?? []), claimed])
        }
        let groups = await db.exec(
          sql`SELECT id, issue_id, name, note, folder_id FROM artwork_groups
              WHERE issue_id IN (SELECT value FROM json_each(${ids})) AND created_at IS NOT NULL
              ORDER BY created_at, id`,
        )
        let groupCopies = await groupCopiesOf(db, ids)
        let groupsByIssue = new Map<number, ClaimedGroup[]>()
        for (let row of groups.rows ?? []) {
          let groupId = Number(row['id'])
          let claimed: ClaimedGroup = {
            artworks: artworks.get(`group:${groupId}`) ?? [],
            copy: groupCopies.get(groupId) ?? null,
            folderTag: groupFolderTag(groupId),
            groupId,
            name: String(row['name']),
            note: text(row['note']) ?? '',
            sourceFolderId: String(row['folder_id']),
          }
          if (claimed.artworks.length === 0 && claimed.copy === null) continue
          let issueId = Number(row['issue_id'])
          groupsByIssue.set(issueId, [...(groupsByIssue.get(issueId) ?? []), claimed])
        }
        return (issues.rows ?? []).map((row: Row) => ({
          articles: byIssue.get(Number(row['id'])) ?? [],
          groups: groupsByIssue.get(Number(row['id'])) ?? [],
          issueId: Number(row['id']),
          issueName: String(row['name']),
          printFolderId: String(row['print_folder_id']),
          sheetId: text(row['sheet_id']),
        }))
      })
    },

    record(runKey, report) {
      return database.transaction(async (db) => {
        let held = await db.exec(
          sql`SELECT claimed_at FROM print_handoffs
              WHERE issue_id = ${report.issueId} AND claim_key = ${runKey}`,
        )
        if ((held.rows ?? []).length === 0) return 'unknown'
        for (let article of report.articles) await recordArticle(db, report.issueId, article)
        for (let group of report.groups ?? []) await recordGroup(db, report.issueId, group)
        await db.exec(
          sql`UPDATE print_handoffs
              SET sheet_id = coalesce(${report.sheetId}, sheet_id),
                  filled_at = CASE WHEN ${report.isComplete ? 1 : 0} = 1
                                   THEN claimed_at ELSE filled_at END,
                  claim_key = NULL, claimed_at = NULL
              WHERE issue_id = ${report.issueId}`,
        )
        return 'accepted'
      })
    },

    async summaryOf(issueId) {
      let result = await database.exec(
        sql`SELECT h.filled_at,
              (SELECT count(*) FROM print_articles p
               WHERE p.issue_id = h.issue_id AND p.text_file_id IS NOT NULL) AS texts,
              (SELECT count(*) FROM print_artworks w
               JOIN print_articles p ON p.article_id = w.article_id
               WHERE p.issue_id = h.issue_id) +
              (SELECT count(*) FROM print_group_artworks w
               JOIN print_groups p ON p.group_id = w.group_id
               WHERE p.issue_id = h.issue_id) AS artworks
            FROM print_handoffs h WHERE h.issue_id = ${issueId}`,
      )
      let row = result.rows?.[0]
      let filledAt = parseStamp(row?.['filled_at'])
      if (row === undefined || filledAt === null) return null
      return { artworks: Number(row['artworks']), filledAt, texts: Number(row['texts']) }
    },
  }
}
