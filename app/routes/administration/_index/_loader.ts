import { data } from 'react-router'

import { readAdminNotice } from '~/utils/admin-notice/read-admin-notice.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'

import type { Route } from './+types/route'
import { PINNED_DASHBOARD_ROWS_PARAM } from './pinned-dashboard-rows'
import { loadApprovedSummaries } from './utils/load-approved-summaries.server'
import { loadDashboardItems } from './utils/load-dashboard-items.server'

// What *Odeslané* keeps after publishing (21b, x24ele6l).
const RECENTLY_PUBLISHED_DAYS = 14
const DRAFTS_SHOWN = 5

export const loader = async ({ request, url }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: [
      'view',
      'create',
      'update',
      'delete',
      'publish',
      'retract',
      'archive',
      'restore',
      'review',
    ],
    entities: [
      'article',
      'article_category',
      'article_tag',
      'podcast',
      'podcast_episode',
      'issue',
    ],
  })

  const now = new Date()
  // Only the Coordinator approves, so only the Coordinator has a queue
  // (gbsczekj, 21b).
  const isApprover = context.roleLevel <= APPROVER_ROLE_LEVEL
  const base = { context, now }

  // A live load of the rows on screen (22f, gl703egt): fresh data for exactly
  // those rows, even the ones that left their section.
  const pinnedKeys = url.searchParams
    .get(PINNED_DASHBOARD_ROWS_PARAM)
    ?.split(',')
    .filter((key) => key !== '')

  const [queue, approved, drafts, submitted, recentlyPublished, pinnedItems] =
    await Promise.all([
      isApprover
        ? loadDashboardItems({
            ...base,
            // The front of the queue first: it has waited longest (21a).
            order: { direction: 'asc', field: 'submittedAt' },
            selection: { ownOnly: false, queues: ['pending'] },
          })
        : [],
      isApprover ? loadApprovedSummaries(context) : [],
      // One's own drafts not yet sent, of every type (21a, gl703egt).
      loadDashboardItems({
        ...base,
        order: { direction: 'desc', field: 'updatedAt' },
        selection: { ownOnly: true, queues: ['draft'] },
        take: DRAFTS_SHOWN,
      }),
      isApprover
        ? []
        : loadDashboardItems({
            ...base,
            order: { direction: 'desc', field: 'submittedAt' },
            selection: { ownOnly: true, queues: ['submitted'] },
          }),
      isApprover
        ? []
        : loadDashboardItems({
            ...base,
            order: { direction: 'desc', field: 'publishedAt' },
            selection: {
              ownOnly: true,
              publishedSince: new Date(
                now.getTime() - RECENTLY_PUBLISHED_DAYS * 24 * 60 * 60 * 1000,
              ),
              queues: [],
            },
          }),
      pinnedKeys === undefined
        ? []
        : loadDashboardItems({
            ...base,
            order: { direction: 'asc', field: 'updatedAt' },
            selection: { keys: pinnedKeys },
          }),
    ])

  // „Uživatel uložen“ after removing one's own administration (28g).
  const notice = await readAdminNotice(request)

  return data(
    {
      approved,
      // Whose live changes are not someone else's (22f).
      authorId: context.authorId,
      canCreateArticle: context.can({
        action: 'create',
        entity: 'article',
        state: 'draft',
        targetAuthorIds: [context.authorId],
      }).hasPermission,
      drafts,
      isApprover,
      pinnedItems,
      queue,
      // Waiting and approved first, then what was published lately (21b).
      submitted: [...submitted, ...recentlyPublished],
      toast: notice.toast,
    },
    notice.toast === null
      ? undefined
      : { headers: { 'Set-Cookie': notice.setCookie } },
  )
}
