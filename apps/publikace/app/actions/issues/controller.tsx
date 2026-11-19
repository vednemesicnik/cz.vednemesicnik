import { redirect } from 'remix/response/redirect'
import { createController } from 'remix/router'
import { Session } from 'remix/session'

import type { SignedInUntilCookie } from '../../auth/session.server.ts'
import { disconnectedBanner } from '../../domain/drive-account.ts'
import {
  checkIssueName,
  createdToast,
  duplicateNameMessage,
  FINISH_UNAVAILABLE_TOAST,
  finishedToast,
  type IssueFilter,
  issueFilterSearch,
  notConnectedToast,
  parseIssueFilter,
  suggestNextName,
} from '../../domain/issue.ts'
import { articleStateTag, authorsLine, documentUrl } from '../../domain/article.ts'
import {
  articleArtworksLine,
  type ArtworkFilter,
  artworkFilterOf,
  type ArtworkState,
  batchState,
  batchStateDetail,
  compareArtworks,
  discardedToast,
  driveFileUrl,
  NO_ARTWORKS,
  RESEND_DAILY_CAP_TOAST,
  RESEND_DISCONNECTED_TOAST,
  RESEND_PDF_GONE_TOAST,
  RESEND_REFUSED_TOAST,
  RESEND_UNAVAILABLE_TOAST,
  resentToast,
  shownSource,
  totalOf,
} from '../../domain/artwork.ts'
import {
  type ArticleFolderKind,
  canDiscard,
  canResend,
  CHECK_UNAVAILABLE_TOAST,
  checkedToast,
  missingFoldersHeading,
  missingFoldersLines,
  RESEND_FOLDER_GONE_TOAST,
  type SubfolderKind,
} from '../../domain/article-folders.ts'
import { folderUrl, type Issue } from '../../domain/issue.ts'
import {
  absoluteUrl,
  articleLinkPath,
  artworksLinkPath,
  RENEWED_TOAST,
  shareText,
  shownUrl,
  usageLine,
} from '../../domain/link.ts'
import { now } from '../../domain/time.ts'
import type { Article, ArticleRow } from '../../data/articles.server.ts'
import type { BatchRow, ListedBatch } from '../../data/artworks.server.ts'
import { checkArticleFolders, recordedMissing } from '../../drive/article-folders.server.ts'
import { discardBatch, resendBatch } from '../../drive/artworks-setup.server.ts'
import { createIssue, finishIssue } from '../../drive/issue-setup.server.ts'
import { Articles, type ArticlesContext } from '../../middleware/articles.server.ts'
import { type Editor, requireEditor } from '../../middleware/auth.server.ts'
import { DriveAccount } from '../../middleware/drive-account.server.ts'
import { flashToast, Toasts } from '../../middleware/toasts.server.ts'
import { routes } from '../../routes.ts'
import type { ToastMessage } from '../../ui/toast/component.tsx'
import {
  type ArticleRowView,
  type ArtworkRowView,
  type ArtworksView,
  DetailPage,
  type DiscardView,
  type LinkBlockView,
  type MissingFoldersView,
} from './detail-page.tsx'
import type { NewIssueDialog } from './overview-page.tsx'
import {
  driveView,
  IN_THE_WAY,
  issuesOf,
  type PageContext,
  REFUSED,
  renderOverview,
} from './render.tsx'

function formText(context: PageContext, name: string): string {
  let value = (context.get(FormData) as FormData).get(name)
  return typeof value === 'string' ? value : ''
}

/*
 * Which issue's folder _Dokončit vydání_ found gone, for the Callout of the detail it redirects
 * to (`12i`). Kept by name, so it is shown on that issue's detail only, and taken once.
 */
const FOLDER_GONE_SESSION_KEY = 'issueFolderGone'

function flashFolderGone(session: Session | undefined, name: string): void {
  session?.flash(FOLDER_GONE_SESSION_KEY, name)
}

function takeFolderGone(session: Session | undefined, name: string): boolean {
  let value = session?.get(FOLDER_GONE_SESSION_KEY)
  if (value === undefined) return false
  session?.unset(FOLDER_GONE_SESSION_KEY)
  return value === name
}

/*
 * Which issue's link is fresh or renewed, so the detail it redirects to highlights the block and
 * focuses _Kopírovat_ until the next load (`12c`, `02d`). By name, and taken once.
 */
const LINK_CHANGED_SESSION_KEY = 'issueLinkChanged'

function flashLinkChanged(session: Session | undefined, name: string): void {
  session?.flash(LINK_CHANGED_SESSION_KEY, name)
}

function takeLinkChanged(session: Session | undefined, name: string): boolean {
  let value = session?.get(LINK_CHANGED_SESSION_KEY)
  if (value === undefined) return false
  session?.unset(LINK_CHANGED_SESSION_KEY)
  return value === name
}

function articlesOf(context: PageContext): ArticlesContext {
  return context.get(Articles) as ArticlesContext
}

/** The subfolders' addresses on Drive, for the names in a missing folder's step (`12j`). */
function subfolderUrls(
  article: Pick<ArticleRow, 'artworksFolderId' | 'licencesFolderId'>,
): MissingFoldersView['urls'] {
  let urls: Partial<Record<SubfolderKind, string>> = {}
  if (article.artworksFolderId !== null) urls.artworks = folderUrl(article.artworksFolderId)
  if (article.licencesFolderId !== null) urls.licences = folderUrl(article.licencesFolderId)
  return urls
}

/** A batch in _Chyba_ that _Poslat žádost znovu_ would send, were its folders there. */
function isResendable(batch: BatchRow): boolean {
  return batchState(batch) === 'error' && batch.mailRefusedAt === null
}

/** The Callout under the article's row, or `null` while all three folders are there (`12j`). */
function missingView(
  issue: Issue,
  article: Article,
  batches: readonly BatchRow[],
): MissingFoldersView | null {
  let missing = recordedMissing(article)
  if (missing.length === 0) return null
  let foundAt = missing
    .map((kind) => article.missing[kind])
    .filter((at): at is Temporal.Instant => at !== null)
    .reduce((first, at) => (Temporal.Instant.compare(at, first) < 0 ? at : first))
  let hasBatchToResend = batches.some(
    (batch) => batch.articleId === article.id && isResendable(batch),
  )
  return {
    checkAction: routes.issues.checkArticleFolders.href({
      id: String(article.id),
      name: issue.name,
    }),
    heading: missingFoldersHeading(missing),
    text: missingFoldersLines({ foundAt, hasBatchToResend, missing }).join(' '),
    urls: subfolderUrls(article),
  }
}

/**
 * The articles of the issue that have a folder on record as missing, asked again: the record goes
 * for a folder that is back (`12j`). Without an account or an answer from Drive, the records
 * stand as they are.
 */
async function recheckMissing(context: PageContext, issue: Issue): Promise<void> {
  let { articles, artworks } = articlesOf(context)
  let marked = (await articles.listCreated(issue.id)).filter(
    (article) => recordedMissing(article).length > 0,
  )
  if (marked.length === 0) return
  let token = await artworks.token()
  if (!token.ok) return
  let deps = { articles, folders: artworks.folders(token.accessToken), now }
  for (let article of marked) await checkArticleFolders(deps, article)
}

/** The block for the link and the rows of _Články_, from what the database has (`12a`). */
async function linkAndArticles(
  context: PageContext,
  issue: Issue,
  isChanged: boolean,
): Promise<{ articles: ArticleRowView[]; link: LinkBlockView | undefined }> {
  let { articles, artworks, links, origin } = articlesOf(context)
  let today = now()
  let created = await articles.listCreated(issue.id)
  let counts = await artworks.artworks.countsByArticle(issue.id)
  let artworksLinks = await links.artworksLinksOf(issue.id)
  let batches = await artworks.artworks.listByIssue(issue.id)
  let rows = created.map((article) => {
    let articleCounts = counts.get(article.id) ?? NO_ARTWORKS
    let artworksLink = artworksLinks.get(article.id)
    return {
      artworks: { count: totalOf(articleCounts), line: articleArtworksLine(articleCounts) },
      artworksUrl:
        artworksLink === undefined ? null : absoluteUrl(origin, artworksLinkPath(artworksLink.key)),
      authors: authorsLine(article.authors),
      documentUrl: documentUrl(article.docId),
      id: article.id,
      missing: missingView(issue, article, batches),
      name: article.name,
      state: articleStateTag(article),
    }
  })
  /* An article with something waiting, among its artworks or a missing folder, stands with what
     waits (`12a`, `12j`). */
  let isWaitingRow = (row: ArticleRowView) =>
    Number((row.artworks.line?.isWaiting ?? false) || row.missing !== null)
  rows.sort((a, b) => isWaitingRow(b) - isWaitingRow(a))

  let link = issue.completedAt === null ? null : await links.articleLinkOf(issue.id)
  if (link === null) return { articles: rows, link: undefined }
  let url = absoluteUrl(origin, articleLinkPath(link.key))
  return {
    articles: rows,
    link: {
      isChanged,
      openHref: articleLinkPath(link.key),
      renewHref: routes.issues.askRenewLink.href({ name: issue.name }),
      shareText: shareText(issue.name, url),
      shown: shownUrl(url),
      url,
      usage: usageLine(await links.usage(link.id), today),
    },
  }
}

/** The address of the detail with the artworks' filter, as `12a` keeps it. */
function detailHref(issue: Issue, filter: ArtworkFilter): string {
  let href = routes.issues.show.href({ name: issue.name })
  return filter === 'all' ? href : `${href}?artworks=${filter}`
}

/** _Obrazová díla_ of the issue: every artwork of its live batches, filtered and in order. */
async function artworksOf(
  context: PageContext,
  issue: Issue,
  filter: ArtworkFilter,
): Promise<ArtworksView> {
  let { articles, artworks } = articlesOf(context)
  let batches = await artworks.artworks.listByIssue(issue.id)
  let missingOf = new Map<number, ArticleFolderKind[]>(
    (await articles.listCreated(issue.id)).map((article) => [article.id, recordedMissing(article)]),
  )
  let isOpen = issue.closedAt === null
  let all: (ArtworkRowView & { uploadedAt: Temporal.Instant })[] = batches.flatMap((batch) => {
    let state: ArtworkState = batchState(batch)
    let missing = missingOf.get(batch.articleId) ?? []
    let query = filter === 'all' ? '' : `?artworks=${filter}`
    let ids = { id: String(batch.id), name: issue.name }
    let actions =
      state === 'error' && isOpen
        ? {
            count: batch.artworks.length,
            discardHref: canDiscard(missing)
              ? `${routes.issues.askDiscardBatch.href(ids)}${query}`
              : null,
            resendAction: canResend(missing)
              ? `${routes.issues.resendBatch.href(ids)}${query}`
              : null,
          }
        : null
    return batch.artworks.map((artwork) => ({
      articleName: batch.articleName,
      author: artwork.author ?? 'neuveden',
      batchActions: actions,
      driveUrl: driveFileUrl(artwork.driveFileId),
      id: artwork.id,
      name: artwork.originalName,
      providerEmail: batch.providerEmail,
      providerName: batch.providerName,
      source:
        artwork.source === null
          ? null
          : { href: artwork.source, shown: shownSource(artwork.source) },
      state,
      stateDetail: batchStateDetail(batch),
      uploadedAt: artwork.uploadedAt,
    }))
  })
  all.sort(compareArtworks)
  let counts: Record<ArtworkFilter, number> = {
    all: all.length,
    approved: 0,
    error: 0,
    provider: 0,
    review: 0,
  }
  for (let row of all) counts[row.state] += 1
  return {
    counts,
    filter,
    hrefOf: (value) => detailHref(issue, value),
    rows: filter === 'all' ? all : all.filter((row) => row.state === filter),
  }
}

function filterOf(context: PageContext): ArtworkFilter {
  return artworkFilterOf(context.url.searchParams.get('artworks'))
}

/** The overview's filter, which `/issues/new` carries in its address as `/` does (`11a`). */
function overviewFilterOf(context: PageContext): IssueFilter {
  return parseIssueFilter(context.url.searchParams.get('state'))
}

async function renderDetail(
  context: PageContext & { auth: { identity: Editor } },
  issue: Issue,
  options: {
    discarding?: DiscardView
    isFolderGone?: boolean
    isRenewing?: boolean
    status?: number
  } = {},
): Promise<Response> {
  let session = context.get(Session) as Session | undefined
  let { articles, link } = await linkAndArticles(
    context,
    issue,
    takeLinkChanged(session, issue.name),
  )
  return context.render(
    <DetailPage
      articles={articles}
      artworks={await artworksOf(context, issue, filterOf(context))}
      discarding={options.discarding}
      driveAccount={await driveView(context)}
      isFolderGone={options.isFolderGone}
      isRenewing={options.isRenewing}
      issue={issue}
      link={link}
      person={context.auth.identity}
      toasts={context.get(Toasts) as readonly ToastMessage[]}
    />,
    options.status === undefined ? undefined : { status: options.status },
  )
}

/** The question _Zahodit dávku_ over the detail, keeping the artworks' filter (`12o`). */
function discardingView(context: PageContext, issue: Issue, batch: ListedBatch): DiscardView {
  let filter = filterOf(context)
  return {
    action: `${routes.issues.discardBatch.href({ id: String(batch.id), name: issue.name })}${filter === 'all' ? '' : `?artworks=${filter}`}`,
    articleName: batch.articleName,
    cancelHref: detailHref(issue, filter),
    count: batch.artworks.length,
    email: batch.providerEmail,
  }
}

/** A live batch of this issue, or `null`: an ID from another issue answers as unknown. */
async function batchOf(context: PageContext, issue: Issue, id: string) {
  let batchId = Number(id)
  if (!Number.isSafeInteger(batchId)) return null
  let batches = await articlesOf(context).artworks.artworks.listByIssue(issue.id)
  return batches.find((batch) => batch.id === batchId) ?? null
}

function notFound(): Response {
  return new Response('Not Found', { status: 404 })
}

/** `/issues/…`: the dialog _Nové vydání_ (`11d`), the detail (`12a`, `12c`, `12i`), finishing. */
export default function createIssuesController(signedInUntil: SignedInUntilCookie) {
  return createController(routes.issues, {
    middleware: [requireEditor(signedInUntil)],
    actions: {
      async new(context) {
        let names = (await issuesOf(context).store.list()).map((issue) => issue.name)
        return renderOverview(context, context.auth.identity, overviewFilterOf(context), {
          kind: 'form',
          name: suggestNextName(names, now()),
        })
      },

      async create(context) {
        let editor = context.auth.identity
        let filter = overviewFilterOf(context)
        let typed = formText(context, 'name')
        let form = (extra: Partial<Extract<NewIssueDialog, { kind: 'form' }>>) =>
          ({ kind: 'form', name: typed, ...extra }) as const

        let checked = checkIssueName(typed)
        if (!checked.ok) {
          return renderOverview(context, editor, filter, form({ fieldError: checked.message }), {
            status: REFUSED,
          })
        }

        let outcome = await createIssue(issuesOf(context).setup, checked.name, editor)
        switch (outcome.kind) {
          case 'created':
            flashToast(context, createdToast(outcome.issue.name))
            flashLinkChanged(context.get(Session), outcome.issue.name)
            return redirect(routes.issues.show.href({ name: outcome.issue.name }), 303)
          case 'duplicate':
            return renderOverview(
              context,
              editor,
              filter,
              form({ fieldError: duplicateNameMessage(outcome.existingName) }),
              { status: REFUSED },
            )
          case 'unfinished':
            return renderOverview(
              context,
              editor,
              filter,
              { issue: outcome.issue, kind: 'unfinished' },
              { status: IN_THE_WAY },
            )
          case 'unavailable':
            return renderOverview(context, editor, filter, form({ isDriveUnavailable: true }), {
              status: IN_THE_WAY,
            })
          /* The dialog already says it from the moment it opens; the answer says it again with
             the field kept (`14g`). */
          case 'not-connected':
          case 'disconnected':
            return renderOverview(context, editor, filter, form({}), { status: IN_THE_WAY })
        }
      },

      async show(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        if (issue === null) return notFound()

        await recheckMissing(context, issue)
        return renderDetail(context, issue, {
          isFolderGone: takeFolderGone(context.get(Session), issue.name),
        })
      },

      /* `12j`: every folder of the article asked again, then back to the detail with what came
         of it. */
      async checkArticleFolders(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        if (issue === null) return notFound()
        let { articles, artworks } = articlesOf(context)
        let articleId = Number(context.params.id)
        let article = Number.isSafeInteger(articleId)
          ? ((await articles.listCreated(issue.id)).find((each) => each.id === articleId) ?? null)
          : null
        if (article === null) return notFound()
        let back = () => redirect(detailHref(issue, filterOf(context)), 303)
        let { expectedEmail } = context.get(DriveAccount)

        let token = await artworks.token()
        if (!token.ok) {
          if (token.reason === 'not-connected')
            flashToast(context, notConnectedToast(expectedEmail), 'error')
          else if (token.reason === 'disconnected')
            flashToast(context, disconnectedBanner(expectedEmail), 'error')
          else flashToast(context, CHECK_UNAVAILABLE_TOAST, 'error')
          return back()
        }
        let checked = recordedMissing(article)
        let check = await checkArticleFolders(
          { articles, folders: artworks.folders(token.accessToken), now },
          article,
        )
        if (check === 'unavailable') {
          flashToast(context, CHECK_UNAVAILABLE_TOAST, 'error')
          return back()
        }
        let toast = checkedToast(checked, check.missing)
        flashToast(context, toast.text, toast.tone === 'error' ? 'error' : undefined)
        return back()
      },

      async askRenewLink(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        if (issue === null || issue.completedAt === null || issue.closedAt !== null)
          return notFound()
        return renderDetail(context, issue, { isRenewing: true })
      },

      /* `02d`: the old key answers `02e` from this moment, and the new one starts from nothing. */
      async renewLink(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        if (issue === null || issue.completedAt === null || issue.closedAt !== null)
          return notFound()
        await articlesOf(context).links.renew(issue.id, now())
        flashToast(context, RENEWED_TOAST)
        flashLinkChanged(context.get(Session), issue.name)
        return redirect(routes.issues.show.href({ name: issue.name }), 303)
      },

      /* `12o`: the batch's request again, then back to the same filter with what happened. */
      async resendBatch(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        let batch = issue === null ? null : await batchOf(context, issue, context.params.id)
        if (issue === null || batch === null) return notFound()
        let back = () => redirect(detailHref(issue, filterOf(context)), 303)
        let outcome = await resendBatch(articlesOf(context).artworks, batch.id)
        switch (outcome.kind) {
          case 'sent':
          case 'already-sent':
            flashToast(context, resentToast(batch.providerEmail))
            return back()
          case 'refused':
            flashToast(context, RESEND_REFUSED_TOAST, 'error')
            return back()
          case 'pdf-gone':
            flashToast(context, RESEND_PDF_GONE_TOAST, 'error')
            return back()
          case 'folder-gone':
            flashToast(context, RESEND_FOLDER_GONE_TOAST, 'error')
            return back()
          case 'daily-cap':
            flashToast(context, RESEND_DAILY_CAP_TOAST, 'error')
            return back()
          case 'disconnected':
          case 'not-connected':
            flashToast(context, RESEND_DISCONNECTED_TOAST, 'error')
            return back()
          case 'unavailable':
            flashToast(context, RESEND_UNAVAILABLE_TOAST, 'error')
            return back()
          case 'closed':
          case 'gone':
            return notFound()
        }
      },

      async askDiscardBatch(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        let batch = issue === null ? null : await batchOf(context, issue, context.params.id)
        if (issue === null || batch === null || issue.closedAt !== null) return notFound()
        /* Only a batch in _Chyba_ is discarded; a sent one goes back to the table. */
        if (batch.mailSentAt !== null) return redirect(detailHref(issue, filterOf(context)), 303)
        return renderDetail(context, issue, { discarding: discardingView(context, issue, batch) })
      },

      async discardBatch(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        let batch = issue === null ? null : await batchOf(context, issue, context.params.id)
        if (issue === null || batch === null) return notFound()
        let back = () => redirect(detailHref(issue, filterOf(context)), 303)
        let outcome = await discardBatch(articlesOf(context).artworks, batch.id)
        switch (outcome.kind) {
          case 'discarded':
            flashToast(context, discardedToast(outcome.batch.artworks.length))
            return back()
          /* A folder went missing while the dialog was open: it stays open and says which. */
          case 'folder-gone': {
            let article = await articlesOf(context).articles.findById(batch.articleId)
            let urls = article === null ? {} : subfolderUrls(article)
            return renderDetail(context, issue, {
              discarding: {
                ...discardingView(context, issue, batch),
                folderGone: { heading: missingFoldersHeading(outcome.missing), urls },
              },
              status: IN_THE_WAY,
            })
          }
          /* An action with a dialog keeps its error in the dialog (`12o`, `11c`). */
          case 'unavailable':
            return renderDetail(context, issue, {
              discarding: {
                ...discardingView(context, issue, batch),
                refusal: outcome.isPartlyBinned ? 'partly-binned' : 'unavailable',
              },
              status: IN_THE_WAY,
            })
          case 'not-connected':
          case 'disconnected':
            return renderDetail(context, issue, {
              discarding: { ...discardingView(context, issue, batch), refusal: 'disconnected' },
              status: IN_THE_WAY,
            })
          /* The provider's page sent the request while the dialog was open: nothing to discard,
             the table now says _U poskytovatele_. */
          case 'already-sent':
            return back()
          case 'closed':
          case 'gone':
            return notFound()
        }
      },

      /*
       * _Dokončit vydání_ acts without a question (`12i`), so every answer but one is a toast on
       * the page it was clicked on: the row of the overview, or the detail. A gone issue folder
       * is the exception, a Callout in the detail that says how to bring it back, because it
       * holds until somebody does; it goes there by a redirect too, so the address stays one a
       * reload can open.
       */
      async finish(context) {
        let { setup, store } = issuesOf(context)
        let issue = await store.findByName(context.params.name)
        if (issue === null) return notFound()

        let isFromOverview = formText(context, 'returnTo') === 'overview'
        let filter = parseIssueFilter(formText(context, 'state'))
        let back = () =>
          redirect(
            isFromOverview
              ? `${routes.home.href()}${issueFilterSearch(filter)}`
              : routes.issues.show.href({ name: issue.name }),
            303,
          )
        let { expectedEmail } = context.get(DriveAccount)

        let outcome = await finishIssue(setup, issue)
        switch (outcome.kind) {
          case 'finished':
            flashToast(context, finishedToast(issue.name))
            flashLinkChanged(context.get(Session), issue.name)
            return back()
          case 'folder-gone':
            flashFolderGone(context.get(Session), issue.name)
            return redirect(routes.issues.show.href({ name: issue.name }), 303)
          case 'not-found':
            return notFound()
          case 'unavailable':
            flashToast(context, FINISH_UNAVAILABLE_TOAST, 'error')
            return back()
          case 'not-connected':
            flashToast(context, notConnectedToast(expectedEmail), 'error')
            return back()
          case 'disconnected':
            flashToast(context, disconnectedBanner(expectedEmail), 'error')
            return back()
        }
      },
    },
  })
}
