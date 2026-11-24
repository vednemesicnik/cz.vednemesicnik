/**
 * The overview drawn at `/` and, with a dialog over it, at `/issues/new` and at the closing and
 * reopening asked from a row, and what the actions of both read from their context.
 */

import type { Person } from '../../middleware/auth.server.ts'
import { Articles, type ArticlesContext } from '../../middleware/articles.server.ts'
import { DriveAccount, type DriveAccountContext } from '../../middleware/drive-account.server.ts'
import { Issues, type IssuesContext } from '../../middleware/issues.server.ts'
import { Toasts } from '../../middleware/toasts.server.ts'
import type { AppContext } from '../../router.ts'
import type { ApprovedCount, IssueFilter } from '../../domain/issue.ts'
import { shownIssueMark } from '../../domain/issue-folders.ts'
import type { ToastMessage } from '../../ui/toast/component.tsx'
import type { IssueStepDialogView } from './issue-parts.tsx'
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
  editor: Person,
  filter: IssueFilter,
  dialog?: NewIssueDialog | IssueStepDialogView,
  init?: ResponseInit,
): Promise<Response> {
  let articles = context.get(Articles) as ArticlesContext
  let [issues, driveAccount, articleCounts, artworkTotals, articleWaiting, groupsMissing] =
    await Promise.all([
      issuesOf(context).store.list(),
      driveView(context),
      articles.articles.countsByIssue(),
      articles.artworks.artworks.countsByIssue(),
      articles.articles.waitingCountsByIssue(),
      articles.artworks.groups.missingCountsByIssue(),
    ])
  /* _Čeká na vás_ adds up the amber and pink tags of the issue's articles and artworks, one for
     each article or group with a missing folder, and one for the issue's own Callout of a missing
     folder (`11a`, `01d`, `12j`): a Callout counts, not a folder. */
  let artworkCounts = new Map<number, ApprovedCount>()
  let waitingCounts = new Map(articleWaiting)
  for (let [issueId, count] of groupsMissing) {
    waitingCounts.set(issueId, (waitingCounts.get(issueId) ?? 0) + count)
  }
  for (let issue of issues) {
    if (shownIssueMark(issue) === null) continue
    waitingCounts.set(issue.id, (waitingCounts.get(issue.id) ?? 0) + 1)
  }
  for (let [issueId, { approved, total, waiting }] of artworkTotals) {
    artworkCounts.set(issueId, { approved, total })
    waitingCounts.set(issueId, (waitingCounts.get(issueId) ?? 0) + waiting)
  }

  return context.render(
    <OverviewPage
      articleCounts={articleCounts}
      artworkCounts={artworkCounts}
      dialog={dialog}
      driveAccount={driveAccount}
      filter={filter}
      hasRegistry={issuesOf(context).hasRegistry}
      issues={issues}
      person={editor}
      toasts={context.get(Toasts) as readonly ToastMessage[]}
      waitingCounts={waitingCounts}
    />,
    init,
  )
}
