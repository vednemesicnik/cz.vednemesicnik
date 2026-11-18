import { createController } from 'remix/router'

import type { SignedInUntilCookie } from '../auth/session.server.ts'
import { parseIssueFilter } from '../domain/issue.ts'
import { requireEditor } from '../middleware/auth.server.ts'
import { routes } from '../routes.ts'
import { renderOverview } from './issues/render.tsx'

/**
 * `/`: the overview of issues (`11a`, `11b`, `11e`). The page and the dialog over it belong to
 * `issues/`, which draws the same page at `/issues/new`.
 */
export default function createHomeController(signedInUntil: SignedInUntilCookie) {
  return createController(routes, {
    middleware: [requireEditor(signedInUntil)],
    actions: {
      home(context) {
        let filter = parseIssueFilter(context.url.searchParams.get('state'))
        return renderOverview(context, context.auth.identity, filter)
      },
    },
  })
}
