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
  notConnectedToast,
  suggestNextName,
} from '../../domain/issue.ts'
import { authorsLine, documentUrl } from '../../domain/article.ts'
import type { Issue } from '../../domain/issue.ts'
import {
  absoluteUrl,
  articleLinkPath,
  RENEWED_TOAST,
  shareText,
  shownUrl,
  usageLine,
} from '../../domain/link.ts'
import { formatDayMonth, now } from '../../domain/time.ts'
import { createIssue, finishIssue } from '../../drive/issue-setup.server.ts'
import { Articles, type ArticlesContext } from '../../middleware/articles.server.ts'
import { type Editor, requireEditor } from '../../middleware/auth.server.ts'
import { DriveAccount } from '../../middleware/drive-account.server.ts'
import { flashToast, Toasts } from '../../middleware/toasts.server.ts'
import { routes } from '../../routes.ts'
import type { ToastMessage } from '../../ui/toast/component.tsx'
import { type ArticleRowView, DetailPage, type LinkBlockView } from './detail-page.tsx'
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

/** The block for the link and the rows of _Články_, from what the database has (`12a`). */
async function linkAndArticles(
  context: PageContext,
  issue: Issue,
  isChanged: boolean,
): Promise<{ articles: ArticleRowView[]; link: LinkBlockView | undefined }> {
  let { articles, links, origin } = articlesOf(context)
  let today = now()
  let created = await articles.listCreated(issue.id)
  let rows = created.map((article) => ({
    authors: authorsLine(article.authors),
    createdLine: `založen ${formatDayMonth(article.createdAt)}`,
    documentUrl: documentUrl(article.docId),
    id: article.id,
    name: article.name,
  }))

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

async function renderDetail(
  context: PageContext & { auth: { identity: Editor } },
  issue: Issue,
  options: { isFolderGone?: boolean; isRenewing?: boolean } = {},
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
      driveAccount={await driveView(context)}
      isFolderGone={options.isFolderGone}
      isRenewing={options.isRenewing}
      issue={issue}
      link={link}
      person={context.auth.identity}
      toasts={context.get(Toasts) as readonly ToastMessage[]}
    />,
  )
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
        return renderOverview(context, context.auth.identity, 'all', {
          kind: 'form',
          name: suggestNextName(names, now()),
        })
      },

      async create(context) {
        let editor = context.auth.identity
        let typed = formText(context, 'name')
        let form = (extra: Partial<Extract<NewIssueDialog, { kind: 'form' }>>) =>
          ({ kind: 'form', name: typed, ...extra }) as const

        let checked = checkIssueName(typed)
        if (!checked.ok) {
          return renderOverview(context, editor, 'all', form({ fieldError: checked.message }), {
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
              'all',
              form({ fieldError: duplicateNameMessage(outcome.existingName) }),
              { status: REFUSED },
            )
          case 'unfinished':
            return renderOverview(
              context,
              editor,
              'all',
              { issue: outcome.issue, kind: 'unfinished' },
              { status: IN_THE_WAY },
            )
          case 'unavailable':
            return renderOverview(context, editor, 'all', form({ isDriveUnavailable: true }), {
              status: IN_THE_WAY,
            })
          /* The dialog already says it from the moment it opens; the answer says it again with
             the field kept (`14g`). */
          case 'not-connected':
          case 'disconnected':
            return renderOverview(context, editor, 'all', form({}), { status: IN_THE_WAY })
        }
      },

      async show(context) {
        let issue = await issuesOf(context).store.findByName(context.params.name)
        if (issue === null) return notFound()

        return renderDetail(context, issue, {
          isFolderGone: takeFolderGone(context.get(Session), issue.name),
        })
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
        let back = () =>
          redirect(
            isFromOverview ? routes.home.href() : routes.issues.show.href({ name: issue.name }),
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
