import type {
  Article,
  ArticleRow,
  ArticleStore,
  ClauseCorrection,
  EditAuthorsOutcome,
  RenameArticleOutcome,
} from '../data/articles.server.ts'
import type { IssueStore } from '../data/issues.server.ts'
import { isAgreed } from '../domain/article-fixes.ts'
import { articleMeta, type Author, META_FILE_NAME } from '../domain/article.ts'
import type { Issue } from '../domain/issue.ts'
import type { DriveAccessToken } from './access-token.server.ts'
import { type ArticleSetup, sendWelcomesTo } from './article-setup.server.ts'
import { checkArticleFolders } from './article-folders.server.ts'
import type { DriveFolders } from './folders.server.ts'
import type { IssueFiles } from './issue-files.server.ts'
import {
  stateOf,
  type Undo,
  type Unreached,
  underIssueName,
  undoAll,
} from './issue-setup.server.ts'
import { logDriveFailure } from './log.server.ts'

/**
 * Mending what was typed wrong when an article was created (#152): its name (`12x`) and its
 * authors (`12y`).
 *
 * All or nothing, as every fix (`11c`): Drive first, because a name on Drive is what a person may
 * still see, then the row, which commits only while nothing changed under it; otherwise every file
 * goes back to what it was. E-mails go only after the commit. Each runs under the issue's name,
 * because a rename of the issue writes the same `_meta.json`.
 */

export type ArticleFixSetup = Pick<ArticleSetup, 'links' | 'mailer' | 'now' | 'origin'> & {
  articles: Pick<
    ArticleStore,
    | 'clearMissing'
    | 'correctAuthors'
    | 'findById'
    | 'markMissing'
    | 'markWelcome'
    | 'rename'
    | 'replaceAuthors'
  >
  files(accessToken: string): IssueFiles
  folders(accessToken: string): DriveFolders
  issues: Pick<IssueStore, 'findById'>
  token(): Promise<DriveAccessToken>
}

/** What stood in the way on Drive: nothing was written. */
type DriveRefusal = { kind: 'doc-missing' | 'folder-missing' | 'meta-binned' } | { kind: Unreached }

export type RenameArticleFixOutcome = RenameArticleOutcome | { kind: 'unchanged' } | DriveRefusal

export type EditAuthorsFixOutcome =
  | Exclude<EditAuthorsOutcome, { kind: 'saved' }>
  | { failed: string[]; kind: 'saved'; sent: string[] }
  | DriveRefusal

/** The authors before the final version, or the corrections after the one marked at `markedAt`. */
export type AuthorsEdit =
  | { authors: readonly Author[]; id: number; markedAt: null }
  | { corrections: readonly ClauseCorrection[]; id: number; markedAt: Temporal.Instant }

const RETRY = Symbol('retry')

/**
 * Runs under the issue's current name, read again inside: a rename of the issue that finished
 * meanwhile changed the name, and the step tries once more under the new one.
 */
async function underIssue<T>(
  setup: ArticleFixSetup,
  issueId: number,
  run: (issue: Issue) => Promise<T>,
): Promise<T | { kind: 'gone' } | { kind: 'unavailable' }> {
  for (let tries = 0; tries < 2; tries += 1) {
    let issue = await setup.issues.findById(issueId)
    if (issue === null || issue.removedAt !== null) return { kind: 'gone' }
    let name = issue.name
    let result = await underIssueName(name, async () => {
      let current = await setup.issues.findById(issueId)
      if (current === null || current.name !== name) return RETRY
      return run(current)
    })
    if (result !== RETRY) return result
  }
  return { kind: 'unavailable' }
}

async function createdArticle(setup: ArticleFixSetup, id: number): Promise<Article | null> {
  let row = await setup.articles.findById(id)
  if (row === null || row.createdAt === null || row.docId === null || row.folderId === null) {
    return null
  }
  return { ...row, createdAt: row.createdAt, docId: row.docId, folderId: row.folderId }
}

/** The article's `_meta.json` as the scripts read it, with this name and these authors. */
function metaOf(article: Article, issue: Issue, name: string, authors: readonly Author[]): string {
  return articleMeta({
    articleFolderId: article.folderId,
    articleName: name,
    authors,
    docId: article.docId,
    issue: issue.name,
    issueFolderId: issue.folderIds.issue ?? '',
  })
}

type MetaWrite = { metaFileId?: string; undo: Undo[] }

/**
 * The article folder checked, then `_meta.json` written over with `content`: in place when it is
 * on the drive, anew with the article's own key when it was deleted for good, and refused when it
 * is in the bin, where a person can restore it (`12y`). `before` writes the other files first, so
 * that their undo comes after this one's.
 */
async function writeMeta(
  setup: ArticleFixSetup,
  accessToken: string,
  article: Article,
  content: { current: string; next: string },
  before: (files: IssueFiles, undo: Undo[]) => Promise<DriveRefusal | null>,
): Promise<MetaWrite | DriveRefusal> {
  let files = setup.files(accessToken)
  let check = await checkArticleFolders(
    { articles: setup.articles, folders: setup.folders(accessToken), now: () => setup.now() },
    { ...article, kind: 'article' },
    ['article'],
  )
  if (check === 'unavailable') return { kind: 'unavailable' }
  if (check.missing.length > 0) return { kind: 'folder-missing' }
  let meta = await stateOf(files, article.metaFileId)
  if (meta === 'unavailable') return { kind: 'unavailable' }
  if (meta === 'binned') return { kind: 'meta-binned' }

  let undo: Undo[] = []
  let refusal = await before(files, undo)
  if (refusal !== null) {
    await undoAll(undo)
    return refusal
  }
  if (meta === 'here') {
    let fileId = article.metaFileId ?? ''
    if (!(await files.replaceText(fileId, content.next))) {
      await undoAll(undo)
      return { kind: 'unavailable' }
    }
    undo.push(() => files.replaceText(fileId, content.current))
    return { undo }
  }
  let made = await files.uploadJson(article.folderId, META_FILE_NAME, content.next, article.formKey)
  if (!made.ok) {
    await undoAll(undo)
    return { kind: 'unavailable' }
  }
  undo.push(() => files.trash(made.id))
  return { metaFileId: made.id, undo }
}

function isRefusal(value: MetaWrite | DriveRefusal): value is DriveRefusal {
  return 'kind' in value
}

/**
 * _Přejmenovat článek_ (`12x`): the Doc, the article folder and `articleName` in `_meta.json`,
 * then the row. The Doc's text stays as it is, the name the template took at creation included.
 */
export async function renameArticle(
  setup: ArticleFixSetup,
  input: { id: number; name: string; shownName: string },
): Promise<RenameArticleFixOutcome> {
  let found = await createdArticle(setup, input.id)
  if (found === null) return { kind: 'gone' }
  return underIssue(setup, found.issueId, async (issue) => {
    let article = await createdArticle(setup, input.id)
    if (article === null) return { kind: 'gone' }
    /* What the commit would refuse, answered before Drive is asked anything. */
    if (issue.closedAt !== null) return { issueName: issue.name, kind: 'closed' }
    if (article.finalVersion !== null) {
      return { kind: 'final-version', step: article.finalVersion }
    }
    if (article.name !== input.shownName) return { kind: 'renamed-meanwhile' }
    if (article.name === input.name) return { kind: 'unchanged' }

    let token = await setup.token()
    if (!token.ok) return { kind: token.reason }
    let docId = article.docId
    let folderId = article.folderId
    let written = await writeMeta(
      setup,
      token.accessToken,
      article,
      {
        current: metaOf(article, issue, article.name, article.authors),
        next: metaOf(article, issue, input.name, article.authors),
      },
      async (files, undo) => {
        let doc = await stateOf(files, docId)
        if (doc === 'unavailable') return { kind: 'unavailable' }
        if (doc !== 'here') return { kind: 'doc-missing' }
        if (!(await files.rename(docId, input.name))) return { kind: 'unavailable' }
        undo.push(() => files.rename(docId, article.name))
        if (!(await files.rename(folderId, input.name))) return { kind: 'unavailable' }
        undo.push(() => files.rename(folderId, article.name))
        return null
      },
    )
    if (isRefusal(written)) return written

    let committed = await commitOrUndo(written.undo, () =>
      setup.articles.rename({ ...input, ...metaFileOf(written) }),
    )
    return committed ?? { kind: 'unavailable' }
  })
}

/**
 * _Upravit autory_ (`12y`): the authors in `_meta.json`, then in the row, and only then the
 * welcome to every address the article did not have. After the final version only the authors
 * who have not agreed, whose clauses go back to be sent under a new key; no welcome goes then.
 * The welcome counts against no cap: a signed-in editor-in-chief sends it, not a link page.
 */
export async function editAuthors(
  setup: ArticleFixSetup,
  input: AuthorsEdit,
): Promise<EditAuthorsFixOutcome> {
  let found = await createdArticle(setup, input.id)
  if (found === null) return { kind: 'gone' }
  return underIssue(setup, found.issueId, async (issue) => {
    let article = await createdArticle(setup, input.id)
    if (article === null) return { kind: 'gone' }
    let refusal = refusalBeforeDrive(article, issue, input)
    if (refusal !== null) return refusal

    let next = nextAuthors(article, input)
    let current = metaOf(article, issue, article.name, article.authors)
    let content = metaOf(article, issue, article.name, next)
    let written: MetaWrite | DriveRefusal = { undo: [] }
    /* Nothing to write when nothing changed, so a save of the same cards asks Drive nothing. */
    if (content !== current) {
      let token = await setup.token()
      if (!token.ok) return { kind: token.reason }
      written = await writeMeta(
        setup,
        token.accessToken,
        article,
        { current, next: content },
        async () => null,
      )
      if (isRefusal(written)) return written
    }

    let metaFileId = written.metaFileId
    let committed = await commitOrUndo(written.undo, () => commit(setup, input, metaFileId))
    if (committed === null) return { kind: 'unavailable' }
    if (committed.kind !== 'saved') return committed
    let saved = await createdArticle(setup, input.id)
    if (saved === null) return { failed: [], kind: 'saved', sent: [] }
    let mailed = await sendWelcomesTo(setup, saved, issue, committed.welcome)
    return { ...mailed, kind: 'saved' }
  })
}

/**
 * What the commit would refuse, answered before Drive is asked anything. The commit checks the
 * same again, for what changes between the two.
 */
function refusalBeforeDrive(
  article: ArticleRow,
  issue: Issue,
  input: AuthorsEdit,
): Exclude<EditAuthorsOutcome, { kind: 'corrected' | 'saved' }> | null {
  if (issue.closedAt !== null) return { issueName: issue.name, kind: 'closed' }
  let finalVersion = article.finalVersion
  if (input.markedAt === null) return finalVersion === null ? null : { kind: 'final-version' }
  if (finalVersion === null) return { kind: 'cancelled' }
  if (!finalVersion.at.equals(input.markedAt)) return { kind: 'final-version' }
  let shown = new Map(finalVersion.authors.map((clause) => [clause.id, clause]))
  for (let correction of input.corrections) {
    let clause = shown.get(correction.clauseId)
    if (clause === undefined) return { kind: 'final-version' }
    if (isAgreed(clause.state)) {
      return {
        agreedAt: clause.approvedAt ?? clause.replyReceivedAt,
        kind: 'agreed',
        name: clause.authorName,
      }
    }
  }
  return null
}

/** The authors `_meta.json` carries after the edit, in their places. */
function nextAuthors(article: ArticleRow, input: AuthorsEdit): Author[] {
  if (input.markedAt === null) return [...input.authors]
  let byPosition = new Map<number, Author>()
  let clauses = new Map((article.finalVersion?.authors ?? []).map((clause) => [clause.id, clause]))
  for (let correction of input.corrections) {
    let clause = clauses.get(correction.clauseId)
    if (clause !== undefined) {
      byPosition.set(clause.position, { email: correction.email, name: correction.name })
    }
  }
  return article.authors.map((author) => byPosition.get(author.position) ?? author)
}

function commit(
  setup: ArticleFixSetup,
  input: AuthorsEdit,
  metaFileId: string | undefined,
): Promise<EditAuthorsOutcome> {
  let written = metaFileId === undefined ? {} : { metaFileId }
  if (input.markedAt === null) {
    return setup.articles.replaceAuthors({ authors: input.authors, id: input.id, ...written })
  }
  return setup.articles.correctAuthors({
    at: setup.now(),
    corrections: input.corrections,
    id: input.id,
    markedAt: input.markedAt,
    ...written,
  })
}

function metaFileOf(written: MetaWrite): { metaFileId?: string } {
  return written.metaFileId === undefined ? {} : { metaFileId: written.metaFileId }
}

/**
 * The row's commit, with Drive put back when it refuses or throws. `null` for a commit that threw,
 * which is logged: Drive was put back and nothing was sent.
 */
async function commitOrUndo<T extends { kind: string }>(
  undo: readonly Undo[],
  run: () => Promise<T>,
): Promise<T | null> {
  try {
    let committed = await run()
    if (!['corrected', 'renamed', 'saved'].includes(committed.kind)) await undoAll(undo)
    return committed
  } catch (error) {
    logDriveFailure(
      'an article fix was not saved',
      error instanceof Error ? error.message : 'unknown error',
    )
    await undoAll(undo)
    return null
  }
}
