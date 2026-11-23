/**
 * The record of an issue made in the app (#111, `03` row 11): its row in the Registr and its
 * Evidence, in the columns the scripts have always written, so a licence is looked up the same
 * way for an old issue and a new one. The app writes them and never reads them.
 *
 * Pure: the sheets' layout, the names their status columns use and the rows, built from what the
 * database holds. Cells leave the app as they are, without `tied`.
 */

import {
  type ArticleProgress,
  type ArticleStep,
  articleState,
  type ArticleState,
  documentUrl,
  isMarked,
} from './article.ts'
import { clauseState, type ClauseState, type ClauseStatus } from './approvals.ts'
import { batchState, type BatchStatus, mayArchive } from './artwork.ts'
import { folderUrl } from './issue.ts'
import { absoluteUrl, articleLinkPath } from './link.ts'

/** What a cell holds: text, a date as a Sheets serial number, or the Registr's checkbox. */
export type Cell = boolean | number | string

/** One list of a spreadsheet as the app lays it out when it creates it. */
export type SheetLayout = {
  /** Columns holding a date, by index: they get a date-time format. */
  dateColumns: readonly number[]
  headers: readonly string[]
  name: string
  /** A checkbox column, by index (the Registr's _Aktivní_). */
  checkboxColumn?: number
  /** The status column, by index, with its dropdown and its colours. */
  status?: {
    colors: readonly { color: string; value: string }[]
    column: number
    helpText?: string
    values: readonly string[]
  }
}

/** The header row's style, as `Issue_Create` gives every list it makes. */
export const HEADER_STYLE = { background: '#1a1814', color: '#ffffff' } as const

/** The date-time format of the date columns, as the scripts' `new Date()` cells read. */
export const DATE_TIME_PATTERN = 'd. M. yyyy H:mm'

/**
 * The app's own list in the Registr. Not the scripts' list _Vydání_: six scripts pick their
 * issues from that one by _Aktivní_ and follow its _ID tabulky_ into the Evidence, so an issue
 * made in the app there would have `Approval_Send` send its clauses a second time. The name is
 * the copywriter's (thread `a6yh3fbz`).
 */
export const REGISTRY_LIST: SheetLayout = {
  checkboxColumn: 3,
  dateColumns: [5],
  headers: [
    'Vydání',
    'ID složky',
    'ID tabulky',
    'Aktivní',
    'URL – Vytvořit článek',
    'Vytvořeno',
    'URL – Vytvořit skupinu obrazových děl',
  ],
  name: 'Vydání z aplikace',
}

/** The spreadsheet's name in the issue folder, as `Issue_Create` names it. */
export const EVIDENCE_NAME = 'Evidence'

/**
 * The key on the Evidence file, with the issue's ID as its value: how a write that stopped after
 * creating the file finds it again, by the key and never by the name (`11c`).
 */
export const EVIDENCE_PROPERTY = 'publikaceEvidence'

const CONSENT_HELP = (who: string) =>
  `U stavu „Odpověď ke kontrole“ přečti odpověď. Pokud ${who} udělil souhlas, nastav „Souhlas k archivaci“. Skript pak konverzaci archivuje.`

/**
 * Články, as `Issue_Create` lays it out. _Dopsáno_ joins its values (`03` row 34): the app's
 * handover, which the scripts never had.
 */
export const ARTICLES_LIST: SheetLayout = {
  dateColumns: [5, 6, 8, 9],
  headers: [
    'Název článku',
    'Odkaz na dokument',
    'ID dokumentu',
    'Autoři',
    'Stav',
    'Vytvořeno',
    'Korektura probíhá – kdy',
    'Korektura probíhá – kdo',
    'K finalizaci – kdy',
    'Aktualizováno',
  ],
  name: 'Články',
  status: {
    colors: [
      { color: '#e0e7ff', value: 'Rozpracováno' },
      { color: '#bfdbfe', value: 'Dopsáno' },
      { color: '#fcd34d', value: 'Korektura probíhá' },
      { color: '#34d399', value: 'K finalizaci' },
    ],
    column: 4,
    values: ['Rozpracováno', 'Dopsáno', 'Korektura probíhá', 'K finalizaci'],
  },
}

export const CLAUSES_LIST: SheetLayout = {
  dateColumns: [0, 6],
  headers: [
    'Timestamp',
    'Název článku',
    'ID dokumentu',
    'Autor',
    'E-mail',
    'Stav',
    'Aktualizováno',
    'Odkaz na konverzaci',
    'Odkaz na licenci',
    'Batch Key',
    'Hash PDF',
    'ID PDF',
    'Chyba',
  ],
  name: 'Redakční doložky',
  status: {
    colors: [
      { color: '#e0e7ff', value: 'K odeslání' },
      { color: '#fcd34d', value: 'Čeká na odpověď' },
      { color: '#fdba74', value: 'Odpověď ke kontrole' },
      { color: '#a7f3d0', value: 'Souhlas k archivaci' },
      { color: '#34d399', value: 'Souhlas udělen' },
      { color: '#f87171', value: 'Chyba' },
    ],
    column: 5,
    helpText: CONSENT_HELP('autor'),
    values: [
      'K odeslání',
      'Čeká na odpověď',
      'Odpověď ke kontrole',
      'Souhlas k archivaci',
      'Souhlas udělen',
      'Chyba',
    ],
  },
}

/** Obrazová díla, with the column _Dílo_ that `Artwork_Upload` appends to it. */
export const ARTWORKS_LIST: SheetLayout = {
  dateColumns: [0, 8],
  headers: [
    'Timestamp',
    'Název článku',
    'ID složky',
    'Poskytovatel',
    'E-mail',
    'Autor',
    'Zdroj',
    'Stav',
    'Aktualizováno',
    'Odkaz na konverzaci',
    'Odkaz na licenci',
    'Batch Key',
    'Chyba',
    'Dílo',
  ],
  name: 'Obrazová díla',
  status: {
    colors: [
      { color: '#fcd34d', value: 'Čeká na odpověď' },
      { color: '#fdba74', value: 'Odpověď ke kontrole' },
      { color: '#a7f3d0', value: 'Souhlas k archivaci' },
      { color: '#34d399', value: 'Souhlas udělen' },
      { color: '#f87171', value: 'Chyba' },
    ],
    column: 7,
    helpText: CONSENT_HELP('poskytovatel'),
    values: [
      'Zpracovávám...',
      'Čeká na odpověď',
      'Odpověď ke kontrole',
      'Souhlas k archivaci',
      'Souhlas udělen',
      'Chyba',
    ],
  },
}

/** The Evidence's lists in their order; the first is the spreadsheet's first. */
export const EVIDENCE_LISTS: readonly SheetLayout[] = [ARTICLES_LIST, CLAUSES_LIST, ARTWORKS_LIST]

/** The spreadsheet, for _Otevřít Evidenci_ (`12a`, `12h`). */
export function spreadsheetUrl(spreadsheetId: string): string {
  return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/edit`
}

/** The conversation in the mailbox `publikace@`, as _Odkaz na konverzaci_ links it. */
export function threadUrl(threadId: string): string {
  return `https://mail.google.com/mail/#all/${encodeURIComponent(threadId)}`
}

/** Days since 30 Dec 1899, Sheets' serial date, of the instant's time in Prague. */
export function serialDate(instant: Temporal.Instant): number {
  let wallClock = instant.toZonedDateTimeISO('Europe/Prague').toPlainDateTime()
  let milliseconds = wallClock.toZonedDateTime('UTC').epochMilliseconds
  return Math.round(milliseconds / 1000) / 86_400 + 25_569
}

function dateCell(instant: Temporal.Instant | null): Cell {
  return instant === null ? '' : serialDate(instant)
}

function latest(...instants: readonly (Temporal.Instant | null)[]): Temporal.Instant | null {
  let found: Temporal.Instant | null = null
  for (let instant of instants) {
    if (instant !== null && (found === null || Temporal.Instant.compare(instant, found) > 0)) {
      found = instant
    }
  }
  return found
}

/** An issue as its Registr row reads it. */
export type RegistryIssue = {
  /** The key of the issue's newest article link, kept for a closed issue: reopening revives it. */
  articleLinkKey: string | null
  evidenceId: string | null
  folderId: string
  isClosed: boolean
  name: string
  startedAt: Temporal.Instant
}

/**
 * One row per issue, in the scripts' columns. _Aktivní_ is an open issue (`12g`); no artwork
 * group link, which the app does not hand out.
 */
export function registryRows(issues: readonly RegistryIssue[], origin: string): Cell[][] {
  return issues.map((issue) => [
    issue.name,
    issue.folderId,
    issue.evidenceId ?? '',
    !issue.isClosed,
    issue.articleLinkKey === null ? '' : absoluteUrl(origin, articleLinkPath(issue.articleLinkKey)),
    serialDate(issue.startedAt),
    '',
  ])
}

/** _Stav_ of Články. A marked article stays _K finalizaci_, as the scripts left it. */
export const ARTICLE_STATUS: Readonly<Record<'handedOver' | 'proofreading' | 'writing', string>> = {
  handedOver: 'Dopsáno',
  proofreading: 'Korektura probíhá',
  writing: 'Rozpracováno',
}

export function articleStatus(state: ArticleState): string {
  if (isMarked(state)) return 'K finalizaci'
  return ARTICLE_STATUS[state as keyof typeof ARTICLE_STATUS]
}

export type RecordArticle = Required<Pick<ArticleProgress, 'createdAt' | 'finalVersion'>> &
  Pick<ArticleProgress, 'handover' | 'proofreading'> & {
    authors: readonly { name: string }[]
    docId: string
    name: string
  }

function stepBy(step: ArticleStep): string {
  return step.name ?? step.email
}

/** Články: one row per created article, oldest first. */
export function articleRows(articles: readonly RecordArticle[]): Cell[][] {
  return articles
    .toSorted((a, b) => Temporal.Instant.compare(a.createdAt, b.createdAt))
    .map((article) => {
      let finalisedAt = article.finalVersion?.at ?? null
      return [
        article.name,
        documentUrl(article.docId),
        article.docId,
        article.authors.map((author) => author.name).join(', '),
        articleStatus(articleState(article)),
        serialDate(article.createdAt),
        dateCell(article.proofreading?.at ?? null),
        article.proofreading === null ? '' : stepBy(article.proofreading),
        dateCell(finalisedAt),
        dateCell(
          latest(
            article.createdAt,
            article.handover?.at ?? null,
            article.proofreading?.at ?? null,
            finalisedAt,
          ),
        ),
      ]
    })
}

/** _Stav_ of Redakční doložky, the names `ClauseState` was written against. */
export const CLAUSE_STATUS: Readonly<Record<ClauseState, string>> = {
  approved: 'Souhlas udělen',
  pending: 'K odeslání',
  review: 'Odpověď ke kontrole',
  unarchived: 'Chyba',
  unsent: 'Chyba',
  verified: 'Souhlas k archivaci',
  waiting: 'Čeká na odpověď',
}

/** One author's clause of a marking that was not cancelled: a cancelled one never left the app. */
export type RecordClause = ClauseStatus & {
  archiveError: string | null
  articleName: string
  authorEmail: string
  authorName: string
  clauseKey: string
  docId: string
  error: string | null
  licencesFolderId: string | null
  markedAt: Temporal.Instant
  pdfFileId: string
  pdfHash: string
  position: number
  replyReceivedAt: Temporal.Instant | null
  replyThreadId: string | null
  sentAt: Temporal.Instant | null
}

/**
 * Redakční doložky: one row per clause, by marking and then by author. A replaced marking's rows
 * stay with their last state, as the scripts' rows stayed when an article was marked again.
 */
export function clauseRows(clauses: readonly RecordClause[]): Cell[][] {
  return clauses
    .toSorted(
      (a, b) =>
        Temporal.Instant.compare(a.markedAt, b.markedAt) ||
        a.docId.localeCompare(b.docId) ||
        a.position - b.position,
    )
    .map((clause) => [
      serialDate(clause.markedAt),
      clause.articleName,
      clause.docId,
      clause.authorName,
      clause.authorEmail,
      CLAUSE_STATUS[clauseState(clause)],
      dateCell(
        latest(
          clause.markedAt,
          clause.sentAt,
          clause.replyReceivedAt,
          clause.consentVerifiedAt,
          clause.approvedAt,
          clause.archiveFailedAt,
        ),
      ),
      clause.replyThreadId === null ? '' : threadUrl(clause.replyThreadId),
      clause.approvedAt === null || clause.licencesFolderId === null
        ? ''
        : folderUrl(clause.licencesFolderId),
      clause.clauseKey,
      clause.pdfHash,
      clause.pdfFileId,
      clause.archiveError ?? clause.error ?? '',
    ])
}

/** _Stav_ of Obrazová díla, `provider` split the way the reply check sees it. */
export function batchStatus(batch: BatchStatus): string {
  let state = batchState(batch)
  if (state === 'approved') return 'Souhlas udělen'
  if (state === 'error') return 'Chyba'
  if (state === 'review') return 'Odpověď ke kontrole'
  return mayArchive(batch) ? 'Souhlas k archivaci' : 'Čeká na odpověď'
}

/** A committed batch the editors did not discard: its artworks are in the bin otherwise. */
export type RecordBatch = BatchStatus & {
  archiveError: string | null
  articleFolderId: string
  articleName: string
  artworks: readonly { author: string | null; source: string | null; storedName: string }[]
  createdAt: Temporal.Instant
  licencesFolderId: string | null
  mailFailedAt: Temporal.Instant | null
  providerEmail: string
  providerName: string
  replyReceivedAt: Temporal.Instant | null
  replyThreadId: string | null
  tag: string
}

/** Obrazová díla: one row per artwork, by batch and then in the batch's order. */
export function artworkRows(batches: readonly RecordBatch[]): Cell[][] {
  return batches
    .toSorted((a, b) => Temporal.Instant.compare(a.createdAt, b.createdAt))
    .flatMap((batch) => {
      let status = batchStatus(batch)
      let updatedAt = dateCell(
        latest(
          batch.createdAt,
          batch.mailSentAt,
          batch.mailFailedAt,
          batch.replyReceivedAt,
          batch.consentVerifiedAt,
          batch.approvedAt,
          batch.archiveFailedAt,
        ),
      )
      return batch.artworks.map((artwork) => [
        serialDate(batch.createdAt),
        batch.articleName,
        batch.articleFolderId,
        batch.providerName,
        batch.providerEmail,
        artwork.author ?? '',
        artwork.source ?? '',
        status,
        updatedAt,
        batch.replyThreadId === null ? '' : threadUrl(batch.replyThreadId),
        batch.approvedAt === null || batch.licencesFolderId === null
          ? ''
          : folderUrl(batch.licencesFolderId),
        batch.tag,
        batch.archiveError ?? '',
        artwork.storedName,
      ])
    })
}

/**
 * At most this many records a pass writes: one read of the lists and two writes each, under
 * Sheets' 60 writes a minute.
 */
export const RECORDS_PER_PASS = 20

/**
 * How long a record that failed waits before the next try: 2, 4, 8… minutes, an hour at most. A
 * change to the record resets it, so a fresh change is tried on the next pass.
 */
export function retryDelay(attempts: number): Temporal.Duration {
  return Temporal.Duration.from({ minutes: Math.min(2 ** Math.max(attempts, 1), 60) })
}

/**
 * Whether every record is due its daily rewrite from the database (`03` row 11). Measured from
 * the last one rather than at a fixed hour, so a machine that slept through the night rewrites
 * on its next pass.
 */
export function isFullRewriteDue(
  lastFullAt: Temporal.Instant | null,
  at: Temporal.Instant,
): boolean {
  if (lastFullAt === null) return true
  return Temporal.Instant.compare(lastFullAt.add({ hours: 24 }), at) <= 0
}
