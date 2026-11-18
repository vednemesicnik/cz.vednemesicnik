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
import { now } from '../../domain/time.ts'
import { createIssue, finishIssue } from '../../drive/issue-setup.server.ts'
import { requireEditor } from '../../middleware/auth.server.ts'
import { DriveAccount } from '../../middleware/drive-account.server.ts'
import { flashToast, Toasts } from '../../middleware/toasts.server.ts'
import { routes } from '../../routes.ts'
import type { ToastMessage } from '../../ui/toast/component.tsx'
import { DetailPage } from './detail-page.tsx'
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

        return context.render(
          <DetailPage
            driveAccount={await driveView(context)}
            isFolderGone={takeFolderGone(context.get(Session), issue.name)}
            issue={issue}
            person={context.auth.identity}
            toasts={context.get(Toasts) as readonly ToastMessage[]}
          />,
        )
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
