/**
 * The overview drawn at `/` and, with the dialog over it, at `/issues/new`, and what the actions
 * of both read from their context.
 */

import type { Editor } from '../../middleware/auth.server.ts'
import { Articles, type ArticlesContext } from '../../middleware/articles.server.ts'
import { DriveAccount, type DriveAccountContext } from '../../middleware/drive-account.server.ts'
import { Issues, type IssuesContext } from '../../middleware/issues.server.ts'
import { Toasts } from '../../middleware/toasts.server.ts'
import type { AppContext } from '../../router.ts'
import type { IssueFilter } from '../../domain/issue.ts'
import type { ToastMessage } from '../../ui/toast/component.tsx'
import { type NewIssueDialog, OverviewPage } from './overview-page.tsx'

/**
 * What the helpers below read. Every action's context has it; it is written loosely because the
 * actions' contexts differ in their params, as in Settings.
 */
export type PageContext = {
  get(key: unknown): unknown
  render: AppContext['render']
  url: URL
}

/*
 * A dialog or a detail that answers a refusal does so with a 4xx: the browser runtime renders a
 * 4xx page into the frame and rejects a 5xx one, so a Drive that does not answer is a 409, the
 * state of things standing in the way, rather than the 503 it is underneath.
 */
export const REFUSED = 400
export const IN_THE_WAY = 409

export function issuesOf(context: PageContext): IssuesContext {
  return context.get(Issues) as IssuesContext
}

export async function driveView(context: PageContext) {
  let driveAccount = context.get(DriveAccount) as DriveAccountContext
  let { status } = await driveAccount.store.state()
  return { expectedEmail: driveAccount.expectedEmail, status }
}

export async function renderOverview(
  context: PageContext,
  editor: Editor,
  filter: IssueFilter,
  dialog?: NewIssueDialog,
  init?: ResponseInit,
): Promise<Response> {
  let articles = context.get(Articles) as ArticlesContext
  let [issues, driveAccount, articleCounts, artworkTotals, missingCounts] = await Promise.all([
    issuesOf(context).store.list(),
    driveView(context),
    articles.articles.countsByIssue(),
    articles.artworks.artworks.countsByIssue(),
    articles.articles.missingCountsByIssue(),
  ])
  /* _Čeká na vás_ is the artworks in _Chyba_ and one for each article with a missing folder
     (`11a`, `12j`). */
  let artworkCounts = new Map(artworkTotals)
  for (let [issueId, missing] of missingCounts) {
    let totals = artworkCounts.get(issueId) ?? { total: 0, waiting: 0 }
    artworkCounts.set(issueId, { ...totals, waiting: totals.waiting + missing })
  }

  return context.render(
    <OverviewPage
      articleCounts={articleCounts}
      artworkCounts={artworkCounts}
      dialog={dialog}
      driveAccount={driveAccount}
      filter={filter}
      issues={issues}
      person={editor}
      toasts={context.get(Toasts) as readonly ToastMessage[]}
    />,
    init,
  )
}
