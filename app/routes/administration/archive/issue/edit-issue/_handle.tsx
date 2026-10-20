import { href } from 'react-router'

import type { Breadcrumb, BreadcrumbMatch } from '~/types/breadcrumb'

import type { Route } from './+types/route'

type Match = BreadcrumbMatch<
  Route.ComponentProps['loaderData'],
  Route.ComponentProps['params']
>

export const handle = {
  breadcrumb: (match: Match): Breadcrumb | null => {
    const { issueId } = match.params

    // A new draft's trail is „Archiv / Nové číslo“ (26c).
    if (match.loaderData?.issue.isEmptyDraft) return null

    return {
      // The last crumb names the page, the record stands before it (copy 5yrb681l).
      label: 'Úprava',
      path: href('/administration/archive/:issueId/edit-issue', { issueId }),
    }
  },
}
