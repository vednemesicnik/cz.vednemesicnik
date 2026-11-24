import type { ArticleStore } from '../data/articles.server.ts'
import type { ArtworkStore } from '../data/artworks.server.ts'
import type { IssueStore } from '../data/issues.server.ts'
import type { RecordMark, RecordStore } from '../data/record.server.ts'
import {
  ARTICLES_LIST,
  articleRows,
  ARTWORKS_LIST,
  artworkRows,
  CLAUSES_LIST,
  clauseRows,
  EVIDENCE_LISTS,
  RECORDS_PER_PASS,
  REGISTRY_LIST,
  registryRows,
} from '../domain/record.ts'
import type { DriveAccessToken } from './access-token.server.ts'
import { logDriveFailure } from './log.server.ts'
import { createLock } from './one-at-a-time.server.ts'
import type { RecordSheets, SheetsResult } from './sheets.server.ts'

/**
 * The record queue (#111): after an action is committed, the Registr and the issue's Evidence
 * follow it, written by `publikace.app@` from the marks the database's triggers left. A sheet
 * that does not answer only delays the record, and no action waits for it or fails with it: the
 * record has no failure state on any screen (`00d`), so a write that keeps failing is a line in
 * the log and nothing else.
 */

export type RecordQueue = {
  articles: Pick<ArticleStore, 'listClausesForRecord' | 'listCreated'>
  artworks: Pick<ArtworkStore, 'listByIssue'>
  issues: Pick<IssueStore, 'findById' | 'setEvidence'>
  marks: RecordStore
  now: () => Temporal.Instant
  /** The app's origin, for the link to new articles in the Registr. */
  origin: string
  /** The Registr spreadsheet; empty skips it, as a laptop without a test Registr does. */
  registryId: string
  sheets: (accessToken: string) => RecordSheets
  token: () => Promise<DriveAccessToken>
}

/**
 * What a queue keeps between passes: its lock, and whether it said that the Registr is not
 * configured. Nothing about a spreadsheet is kept: its lists and their protection are looked at
 * before every write, one read, so a protection taken off by hand is put back by the next write.
 */
type PassState = {
  hasSaidNoRegistry: boolean
  lock: ReturnType<typeof createLock>
}

const states = new WeakMap<RecordQueue, PassState>()

function stateOf(queue: RecordQueue): PassState {
  let state = states.get(queue)
  if (state === undefined) {
    state = { hasSaidNoRegistry: false, lock: createLock() }
    states.set(queue, state)
  }
  return state
}

async function writeEvidence(
  queue: RecordQueue,
  sheets: RecordSheets,
  issueId: number,
): Promise<SheetsResult> {
  let issue = await queue.issues.findById(issueId)
  let folderId = issue?.folderIds.issue ?? null
  if (issue === null || issue.completedAt === null || folderId === null) return { ok: true }

  let spreadsheetId = issue.evidenceSpreadsheetId
  if (spreadsheetId === null) {
    let found = await sheets.findOrCreateEvidence(folderId, issueId)
    if (!found.ok) return found
    let made = await sheets.layOut(found.id, EVIDENCE_LISTS, { isOwn: true })
    if (!made.ok) return made
    /* Stored only once it is laid out, so a write that stopped halfway lays it out again. The
       ID marks the Registr, whose row then names it. */
    await queue.issues.setEvidence(issueId, found.id)
    spreadsheetId = found.id
  } else {
    let checked = await sheets.layOut(spreadsheetId, EVIDENCE_LISTS, { isOwn: true })
    if (!checked.ok) return checked
  }

  let articles = await queue.articles.listCreated(issueId)
  let clauses = await queue.articles.listClausesForRecord(issueId)
  /* A group's rows carry its name and its folder where an article's carry the article's, as the
     scripts' rows for a group do (#133). */
  let batches = (await queue.artworks.listByIssue(issueId)).flatMap((batch) => {
    if (batch.holder.folderId === null) return []
    return [
      {
        ...batch,
        articleFolderId: batch.holder.folderId,
        articleName: batch.holder.name,
        artworks: batch.artworks.filter((artwork) => artwork.removedAt === null),
        licencesFolderId: batch.holder.licencesFolderId,
      },
    ]
  })

  return sheets.write(spreadsheetId, [
    { layout: ARTICLES_LIST, rows: articleRows(articles) },
    { layout: CLAUSES_LIST, rows: clauseRows(clauses) },
    { layout: ARTWORKS_LIST, rows: artworkRows(batches) },
  ])
}

async function writeRegistry(queue: RecordQueue, sheets: RecordSheets): Promise<SheetsResult> {
  let state = stateOf(queue)
  if (queue.registryId === '') {
    if (!state.hasSaidNoRegistry) {
      console.info('[record] REGISTRY_SPREADSHEET_ID is empty: the Registr is not written.')
      state.hasSaidNoRegistry = true
    }
    return { ok: true }
  }
  let checked = await sheets.layOut(queue.registryId, [REGISTRY_LIST])
  if (!checked.ok) return checked
  let rows = registryRows(await queue.marks.registryIssues(), queue.origin)
  return sheets.write(queue.registryId, [{ layout: REGISTRY_LIST, rows }])
}

function describeMark(mark: RecordMark): string {
  return mark.kind === 'registry' ? 'the Registr' : `the Evidence of issue ${mark.issueId}`
}

/**
 * One pass: the daily rewrite when it is due, then the marks whose time has come. Nothing is
 * tried while the account is not connected (`14g`): the marks wait, and the pass after it is
 * connected again writes them. One pass at a time, whoever starts it.
 */
export async function drainRecordQueue(queue: RecordQueue): Promise<void> {
  await stateOf(queue).lock.ifFree('record', async () => {
    let token = await queue.token()
    if (!token.ok) return
    let sheets = queue.sheets(token.accessToken)

    await queue.marks.markAllIfDue(queue.now())
    for (let mark of await queue.marks.takeDue(queue.now(), RECORDS_PER_PASS)) {
      /* A throw is a failure of this record alone: it is put off like any other, rather than
         stopping the pass and coming first again in the next one. */
      let result: SheetsResult
      try {
        result =
          mark.kind === 'registry'
            ? await writeRegistry(queue, sheets)
            : await writeEvidence(queue, sheets, mark.issueId)
      } catch (error) {
        result = { error: error instanceof Error ? error.message : String(error), ok: false }
      }
      if (result.ok) {
        await queue.marks.markWritten(mark)
      } else {
        logDriveFailure(`${describeMark(mark)} was not written`, result.error)
        await queue.marks.markFailed(mark, queue.now(), result.error)
      }
    }
  })
}

/**
 * Runs a pass now and every `intervalMs` after, without keeping the process alive.
 * `createPublikace` starts it and its `close()` stops it; the suite calls `drainRecordQueue` itself. `stop` waits for
 * the pass under way, so the database it writes to is closed only after it.
 */
export function startRecordQueue(
  queue: RecordQueue,
  intervalMs = 30_000,
): { stop(): Promise<void> } {
  let running: Promise<void> = Promise.resolve()
  let run = () => {
    running = drainRecordQueue(queue).catch((error: unknown) => {
      console.error('[record] a pass of the record queue failed:', error)
    })
  }
  run()
  let timer = setInterval(run, intervalMs)
  timer.unref()
  return {
    stop() {
      clearInterval(timer)
      return running
    },
  }
}
