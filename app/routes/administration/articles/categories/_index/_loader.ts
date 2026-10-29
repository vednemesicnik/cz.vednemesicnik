import { data, redirect } from 'react-router'

import {
  CONTRIBUTOR_STATE_FILTER_QUEUES,
  STATE_FILTER_QUEUES,
} from '~/config/content-queue-config'
import {
  buildStaleFilterRedirect,
  parseAdminListFilters,
} from '~/utils/admin-list-filters'
import { parseAdminListParams } from '~/utils/admin-list-params'
import { readAdminNotice } from '~/utils/admin-notice/read-admin-notice.server'
import { buildContentQueueWhere } from '~/utils/build-content-queue-where'
import { buildLastPageRedirect } from '~/utils/build-last-page-redirect'
import { countContentQueues } from '~/utils/count-content-queues.server'
import { prisma } from '~/utils/db.server'
import { isPagePastLast } from '~/utils/is-page-past-last'
import { loadSavedFilters } from '~/utils/load-saved-filters.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'
import { resolveDefaultFilter } from '~/utils/resolve-default-filter.server'
import { buildTaxonomyPermissionWhere } from '../../utils/build-taxonomy-permission-where'
import { getNameOrderedPage } from '../../utils/get-name-ordered-page'
import { getTaxonomyRow } from '../../utils/get-taxonomy-row.server'
import { TAXONOMY_ROW_SELECT } from '../../utils/taxonomy-row-select'
import type { Route } from './+types/route'
import { SORT_KEYS } from './sort'

const PAGE_SIZE = 20

const TABLE_KEY = 'article_categories'

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
    entities: ['article_category'],
  })

  // Before any query: a bare visit with a default preset never renders this list,
  // it redirects to the preset's own URL.
  await resolveDefaultFilter({
    tableKey: TABLE_KEY,
    url,
    userId: context.userId,
  })

  // Looked up, not processed: by name, ascending (25a).
  const { order, page, query } = parseAdminListParams(request, {
    defaultOrder: 'asc',
    defaultSort: 'name',
    sortKeys: SORT_KEYS,
  })

  const filters = parseAdminListFilters(request, TABLE_KEY)

  const permissionWhere = buildTaxonomyPermissionWhere(
    context,
    'article_category',
  )

  // The query matches the name or the slug — public URLs expose the slug.
  // SQLite `contains` is case-insensitive for ASCII only; Czech diacritics
  // match case-sensitively (accepted limitation). The field filter is ANDed with
  // the permission clause, so it only ever narrows what the role may view.
  const where = {
    AND: [
      permissionWhere,
      ...(query === ''
        ? []
        : [
            {
              OR: [
                { name: { contains: query } },
                { slug: { contains: query } },
              ],
            },
          ]),
      ...(filters.state === undefined
        ? []
        : [{ OR: filters.state.map(buildContentQueueWhere) }]),
    ],
  }

  // A Contributor approves nothing: Odeslané instead of Ke schválení and
  // Schválené (22i).
  const isContributor = context.roleName === 'contributor'

  const [matchingCategories, savedFilters, queueCounts] = await Promise.all([
    // Every match by name: the order is Czech, not SQLite's (25a, 11c).
    prisma.articleCategory.findMany({
      select: { id: true, name: true },
      where,
    }),
    loadSavedFilters({ tableKey: TABLE_KEY, url, userId: context.userId }),
    // The Stav menu counts work within what the role may view, whatever else
    // is searched or filtered (22d).
    countContentQueues(isContributor, (queue) =>
      prisma.articleCategory.count({
        where: { AND: [permissionWhere, buildContentQueueWhere(queue)] },
      }),
    ),
  ])

  const { pageIds, totalCount } = getNameOrderedPage(matchingCategories, {
    order,
    page,
    pageSize: PAGE_SIZE,
  })

  // A state the role's menu does not offer (a Coordinator's link opened by a
  // Contributor) drops, or it would filter unseen.
  const staleFilterRedirect = buildStaleFilterRedirect(url, {
    state: (isContributor
      ? CONTRIBUTOR_STATE_FILTER_QUEUES
      : STATE_FILTER_QUEUES
    ).map((queue) => ({ value: queue })),
  })

  if (staleFilterRedirect !== null) {
    throw redirect(staleFilterRedirect)
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Deleting the last row on the last page revalidates a URL past the end.
  if (isPagePastLast(page, totalPages)) {
    throw redirect(buildLastPageRedirect(url, totalPages))
  }

  const [pageCategories, pageArticleCounts] = await Promise.all([
    prisma.articleCategory.findMany({
      select: TAXONOMY_ROW_SELECT,
      where: { id: { in: pageIds } },
    }),
    // Deleting takes the category off every article it has, in any state
    // (25d). A query of its own: `_count` holds one count per relation.
    prisma.articleCategory.findMany({
      select: { _count: { select: { articles: true } }, id: true },
      where: { id: { in: pageIds } },
    }),
  ])

  const categoriesById = new Map(
    pageCategories.map((category) => [category.id, category]),
  )
  const articleCounts = new Map(
    pageArticleCounts.map((category) => [
      category.id,
      category._count.articles,
    ]),
  )

  const isApprover = context.roleLevel <= APPROVER_ROLE_LEVEL

  const categories = pageIds.flatMap((id) => {
    const category = categoriesById.get(id)

    // Deleted between the two queries.
    if (category === undefined) {
      return []
    }

    return [
      getTaxonomyRow(category, {
        articleCount: articleCounts.get(category.id) ?? 0,
        context,
        entity: 'article_category',
      }),
    ]
  })

  // Read only here: an earlier redirect must not use up the toast (23f).
  const notice = await readAdminNotice(request)

  return data(
    {
      ...savedFilters,
      canCreate: context.can({
        action: 'create',
        entity: 'article_category',
        state: 'draft',
        targetAuthorIds: [context.authorId],
      }).hasPermission,
      categories,
      currentPage: page,
      filters,
      isApprover,
      isContributor,
      pageSize: PAGE_SIZE,
      query,
      queueCounts,
      // Smazáno after a delete from the detail, once (23f).
      toast: notice.toast,
      totalCount,
      totalPages,
    },
    notice.toast === null
      ? undefined
      : { headers: { 'Set-Cookie': notice.setCookie } },
  )
}
