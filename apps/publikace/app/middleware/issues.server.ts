import { createContextKey, type Middleware } from 'remix/router'

import type { IssueStore } from '../data/issues.server.ts'
import type { IssueSetup } from '../drive/issue-setup.server.ts'

/** The issues and the way their folders are made. Read with `context.get(Issues)`. */
export type IssuesContext = {
  /** Whether the deployment names a Registr, for the dialog's sentence about the record (`11d`). */
  hasRegistry: boolean
  setup: IssueSetup
  store: IssueStore
}

export const Issues = createContextKey<IssuesContext>()

/**
 * Handed in rather than built here, like the Drive account, so a test runs on its own database
 * and its own Drive.
 */
export function loadIssues(
  issues: IssuesContext,
): Middleware<{ key: typeof Issues; property: 'issues'; value: IssuesContext }> {
  return (context, next) => {
    context.set(Issues, issues)
    return next()
  }
}
