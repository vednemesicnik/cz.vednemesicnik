import type { Article, ArticleRow, ArticleStore } from '../data/articles.server.ts'
import type { IssueStore } from '../data/issues.server.ts'
import type { LinkStore } from '../data/links.server.ts'
import {
  ARTICLE_NAME_PLACEHOLDER_IN_TEMPLATE,
  articleMeta,
  type Author,
  documentUrl,
  META_FILE_NAME,
  SUBMISSIONS_PER_HOUR,
} from '../domain/article.ts'
import type { Issue } from '../domain/issue.ts'
import { absoluteUrl, artworksLinkPath, linkState } from '../domain/link.ts'
import type { Mailer } from '../mail/mailer.server.ts'
import { welcomeEmail } from '../mail/welcome-email.server.ts'
import type { DriveAccessToken } from './access-token.server.ts'
import type { ArticleFiles } from './article-files.server.ts'
import type { DriveFolders } from './folders.server.ts'
import { logDriveFailure } from './log.server.ts'
import { createLock } from './one-at-a-time.server.ts'

/**
 * Creating an article from the link for the newsroom (`20c`, `20d`).
 *
 * All or nothing, as every action but the issue is (`11c`, `03` row 43). The attempt's row comes
 * first and each file's ID is stored the moment Drive returns it; when a step fails, every file
 * the attempt made goes to the shared drive's bin and the row goes, so _Článek se nevytvořil._ is
 * true and the next send is a fresh attempt. Nothing is ever deleted for good, and nothing that
 * this attempt did not make is touched: the files are found by their stored IDs and by the form
 * key on each of them, never by a name.
 *
 * The welcome e-mails go after the article is committed. A sent e-mail cannot be taken back, so
 * no failure after the commit undoes the article.
 */

export type ArticleSetup = {
  articles: ArticleStore
  files(accessToken: string): ArticleFiles
  folders(accessToken: string): DriveFolders
  issues: IssueStore
  links: LinkStore
  mailer: Mailer
  now(): Temporal.Instant
  /** Where the links in the welcome e-mail point: `APP_ORIGIN`. */
  origin: string
  /** `ARTICLE_TEMPLATE_DOCUMENT_ID`. */
  templateId: string
  token(): Promise<DriveAccessToken>
}

export type NewArticle = {
  authors: readonly Author[]
  /** The form's one-time key: a second send with it gets the first one's answer. */
  formKey: string
  /** The link the form was opened through. */
  linkKey: string
  name: string
}

export type CreatedArticle = {
  article: Article
  artworksUrl: string
  /** Whether the welcome e-mail went to every author, which is all `20d` says of it. */
  isEveryWelcomeSent: boolean
  issue: Issue
}

export type CreateArticleOutcome =
  | ({ kind: 'created' } & CreatedArticle)
  | { kind: 'disconnected' | 'not-connected' }
  | { kind: 'folder-gone' }
  | { kind: 'limited' }
  | { kind: 'link-gone' }
  | { kind: 'unavailable' }

const lock = createLock()

export function createArticle(
  setup: ArticleSetup,
  article: NewArticle,
): Promise<CreateArticleOutcome> {
  return lock(`article:${article.formKey}`, () => create(setup, article))
}

async function create(setup: ArticleSetup, input: NewArticle): Promise<CreateArticleOutcome> {
  let link = await setup.links.findByKey(input.linkKey)
  let replayed = await replayOf(setup, input.formKey, link?.id ?? null)
  if (replayed !== null) return replayed
  let issue = link === null ? null : await setup.issues.findById(link.issueId)
  if (
    link === null ||
    issue === null ||
    link.kind !== 'article' ||
    linkState(link, issue) !== 'valid'
  ) {
    return { kind: 'link-gone' }
  }
  /* A form key another link's form drew: only a crafted send carries one. */
  let existing = await setup.articles.findByFormKey(input.formKey)
  if (existing !== null && existing.linkId !== link.id) return { kind: 'unavailable' }
  let isRetry = existing !== null

  let token = await setup.token()
  if (!token.ok) return { kind: token.reason }
  let files = setup.files(token.accessToken)

  await cleanUpPending(setup, files, input.formKey)
  /* This form's own earlier attempt is still waiting for its files to reach the bin. */
  if ((await setup.articles.findByFormKey(input.formKey)) !== null) return { kind: 'unavailable' }

  let articlesFolderId = issue.folderIds.articles
  if (articlesFolderId === null) return { kind: 'folder-gone' }
  let presence = await setup.folders(token.accessToken).presence(articlesFolderId)
  if (presence === 'gone') return { kind: 'folder-gone' }
  if (presence === 'unavailable') return { kind: 'unavailable' }

  if (setup.templateId === '') {
    logDriveFailure('an article was not created', 'ARTICLE_TEMPLATE_DOCUMENT_ID is empty')
    return { kind: 'unavailable' }
  }

  /* The count and the row in one step per link, so sends in parallel cannot all pass the limit. */
  let since = setup.now().subtract({ minutes: 60 })
  let attempt = await lock(`link:${link.id}`, async () => {
    if (!isRetry && (await setup.articles.recentAttempts(link.id, since)) >= SUBMISSIONS_PER_HOUR) {
      return null
    }
    let started = await setup.articles.startAttempt({
      at: setup.now(),
      authors: input.authors,
      formKey: input.formKey,
      issueId: issue.id,
      linkId: link.id,
      name: input.name,
    })
    return started.attempt
  })
  if (attempt === null) return { kind: 'limited' }

  let committed: Article | null = null
  try {
    if (await makeFiles(setup, files, attempt, issue, articlesFolderId)) {
      committed = await setup.articles.commit(attempt.id, setup.now())
    }
  } catch (error) {
    logDriveFailure(
      'an article was not created',
      error instanceof Error ? error.message : 'unknown error',
    )
  }
  if (committed === null) {
    await cleanUp(setup, files, attempt, articlesFolderId)
    let after = await setup.folders(token.accessToken).presence(articlesFolderId)
    return { kind: after === 'gone' ? 'folder-gone' : 'unavailable' }
  }

  await sendWelcomes(setup, committed, issue)
  let current = (await setup.articles.findByFormKey(input.formKey)) ?? committed
  return createdOutcome(setup, current)
}

/**
 * The answer a second send of a form gets once its article exists: the same `20d`, also after
 * the link was replaced in between, but only through the link the form was drawn for.
 */
export async function replayedArticle(
  setup: ArticleSetup,
  formKey: string,
  linkKey: string,
): Promise<CreateArticleOutcome | null> {
  let link = await setup.links.findByKey(linkKey)
  return replayOf(setup, formKey, link?.id ?? null)
}

async function replayOf(
  setup: ArticleSetup,
  formKey: string,
  linkId: number | null,
): Promise<CreateArticleOutcome | null> {
  let existing = await setup.articles.findByFormKey(formKey)
  if (existing === null || existing.createdAt === null || existing.linkId !== linkId) return null
  return createdOutcome(setup, existing)
}

/** The folder, the Doc with the article's name in it, and `_meta.json`, each ID stored at once. */
async function makeFiles(
  setup: ArticleSetup,
  files: ArticleFiles,
  attempt: ArticleRow,
  issue: Issue,
  articlesFolderId: string,
): Promise<boolean> {
  let folder = await files.createFolder(articlesFolderId, attempt.name, attempt.formKey)
  if (!folder.ok) return false
  await setup.articles.setDriveId(attempt.id, 'folder', folder.id)

  let doc = await files.copyFile(setup.templateId, folder.id, attempt.name, attempt.formKey)
  if (!doc.ok) return false
  await setup.articles.setDriveId(attempt.id, 'doc', doc.id)

  let isNamed = await files.replaceText(doc.id, ARTICLE_NAME_PLACEHOLDER_IN_TEMPLATE, attempt.name)
  if (!isNamed) return false

  let meta = articleMeta({
    articleFolderId: folder.id,
    articleName: attempt.name,
    authors: attempt.authors,
    docId: doc.id,
    issue: issue.name,
    issueFolderId: issue.folderIds.issue ?? '',
  })
  let metaFile = await files.uploadJson(folder.id, META_FILE_NAME, meta, attempt.formKey)
  if (!metaFile.ok) return false
  await setup.articles.setDriveId(attempt.id, 'meta', metaFile.id)
  return true
}

/**
 * Puts every file of a failed attempt in the bin and removes its row. The stored IDs cover what
 * Drive answered; the form key on each file covers a reply lost on the way back. When Drive does
 * not answer even this, the row stays marked and the cleanup is tried again.
 */
async function cleanUp(
  setup: ArticleSetup,
  files: ArticleFiles,
  attempt: ArticleRow,
  articlesFolderId: string | null,
): Promise<boolean> {
  let current = (await setup.articles.findByFormKey(attempt.formKey)) ?? attempt
  let ids = new Set(
    [current.metaFileId, current.docId, current.folderId].filter((id): id is string => id !== null),
  )
  let isComplete = true

  /* What carries the key in _Články_ is the attempt's folder, whether its reply came or not; the
     Doc and `_meta.json` are looked for inside each such folder. */
  let articleFolders = new Set(current.folderId === null ? [] : [current.folderId])
  if (articlesFolderId !== null) {
    let tagged = await files.findTagged(articlesFolderId, attempt.formKey)
    if (tagged === null) isComplete = false
    else for (let id of tagged) articleFolders.add(id)
  }
  for (let folderId of articleFolders) {
    ids.add(folderId)
    let tagged = await files.findTagged(folderId, attempt.formKey)
    if (tagged === null) isComplete = false
    else for (let id of tagged) ids.add(id)
  }

  for (let id of ids) {
    if (!(await files.trash(id))) isComplete = false
  }

  if (isComplete) await setup.articles.discard(current.id)
  else await setup.articles.markForCleanup(current.id, setup.now())
  return isComplete
}

/**
 * The attempts whose cleanup failed before. Another form's attempt is cleaned only while its key
 * is free and taken for the length of it, so its own resend cannot start afresh under the same key
 * meanwhile and have its new files found by that key and put in the bin.
 */
async function cleanUpPending(
  setup: ArticleSetup,
  files: ArticleFiles,
  ownFormKey: string | null,
): Promise<void> {
  for (let attempt of await setup.articles.pendingCleanups()) {
    if (attempt.formKey === ownFormKey) await cleanUpMarked(setup, files, attempt)
    else await lock.ifFree(`article:${attempt.formKey}`, () => cleanUpMarked(setup, files, attempt))
  }
}

/** Cleans the attempt only while it is still the one that was marked, read again under its key. */
async function cleanUpMarked(
  setup: ArticleSetup,
  files: ArticleFiles,
  attempt: ArticleRow,
): Promise<void> {
  let current = await setup.articles.findByFormKey(attempt.formKey)
  if (
    current === null ||
    current.id !== attempt.id ||
    !current.startedAt.equals(attempt.startedAt) ||
    current.createdAt !== null ||
    current.cleanupAt === null
  ) {
    return
  }
  let issue = await setup.issues.findById(current.issueId)
  await cleanUp(setup, files, current, issue?.folderIds.articles ?? null)
}

/**
 * At startup, before the port opens: no request is running, so every uncommitted attempt is one a
 * crash or a failed cleanup left behind. Each is marked first, so that without a connected
 * account, or with Drive down, the next send cleans it up.
 */
export async function cleanUpAbandoned(setup: ArticleSetup): Promise<void> {
  let abandoned = await setup.articles.abandonedAttempts()
  if (abandoned.length === 0) return
  for (let attempt of abandoned) {
    if (attempt.cleanupAt === null) await setup.articles.markForCleanup(attempt.id, setup.now())
  }
  let token = await setup.token()
  if (!token.ok) return
  await cleanUpPending(setup, setup.files(token.accessToken), null)
}

async function sendWelcomes(setup: ArticleSetup, article: Article, issue: Issue): Promise<void> {
  let artworksUrl = await artworksUrlOf(setup, article)
  for (let author of article.authors) {
    if (author.welcomeSentAt !== null) continue
    let result = await setup.mailer(
      welcomeEmail({
        articleName: article.name,
        artworksUrl,
        coauthors: article.authors
          .filter((other) => other.position !== author.position)
          .map((other) => other.name),
        documentUrl: documentUrl(article.docId),
        formKey: article.formKey,
        issueName: issue.name,
        to: author.email,
      }),
    )
    await setup.articles.markWelcome(
      article.id,
      author.position,
      result.ok ? 'sent' : 'failed',
      setup.now(),
    )
  }
}

async function artworksUrlOf(setup: ArticleSetup, article: Article): Promise<string> {
  let links = await setup.links.artworksLinksOf(article.issueId)
  let link = links.get(article.id)
  return link === undefined ? '' : absoluteUrl(setup.origin, artworksLinkPath(link.key))
}

async function createdOutcome(setup: ArticleSetup, row: ArticleRow): Promise<CreateArticleOutcome> {
  let issue = await setup.issues.findById(row.issueId)
  if (issue === null || row.createdAt === null || row.docId === null || row.folderId === null) {
    return { kind: 'unavailable' }
  }
  let article: Article = {
    ...row,
    createdAt: row.createdAt,
    docId: row.docId,
    folderId: row.folderId,
  }
  return {
    article,
    artworksUrl: await artworksUrlOf(setup, article),
    isEveryWelcomeSent: article.authors.every((author) => author.welcomeSentAt !== null),
    issue,
    kind: 'created',
  }
}
