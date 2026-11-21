import { redirect } from 'remix/response/redirect'
import { createController } from 'remix/router'

import type { SignedInUntilCookie } from '../auth/session.server.ts'
import { parseIssueFilter } from '../domain/issue.ts'
import { requireProofreading } from '../middleware/auth.server.ts'
import { routes } from '../routes.ts'
import { renderOverview } from './issues/render.tsx'

/**
 * `/`: the overview of issues (`11a`, `11b`, `11e`). The page and the dialog over it belong to
 * `issues/`, which draws the same page at `/issues/new`.
 *
 * `/` is where the app starts, not a screen anybody sends, so a proofreader who is not an
 * editor-in-chief is taken to the page Korektura rather than refused (`10d`).
 */
export default function createHomeController(signedInUntil: SignedInUntilCookie) {
  return createController(routes, {
    middleware: [requireProofreading(signedInUntil)],
    actions: {
      home(context) {
        let person = context.auth.identity
        if (!person.isEditor) return redirect(routes.proofreading.index.href(), 303)
        let filter = parseIssueFilter(context.url.searchParams.get('state'))
        return renderOverview(context, person, filter)
      },
    },
  })
}
