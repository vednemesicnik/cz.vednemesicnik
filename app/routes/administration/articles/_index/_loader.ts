import type { Prisma } from '@generated/prisma/client'
import { data, redirect } from 'react-router'
import {
  CONTRIBUTOR_STATE_FILTER_QUEUES,
  STATE_FILTER_QUEUES,
} from '~/config/content-queue-config'
import {
  buildStaleFilterRedirect,
  parseAdminListFilters,
} from '~/utils/admin-list-filters'
import { parseAdminListParams, type SortOrder } from '~/utils/admin-list-params'
import { readAdminNotice } from '~/utils/admin-notice/read-admin-notice.server'
import { buildContentQueueWhere } from '~/utils/build-content-queue-where'
import { buildLastPageRedirect } from '~/utils/build-last-page-redirect'
import { countContentQueues } from '~/utils/count-content-queues.server'
import { prisma } from '~/utils/db.server'
import { formatNumericDate } from '~/utils/format-numeric-date'
import { isPagePastLast } from '~/utils/is-page-past-last'
import { loadSavedFilters } from '~/utils/load-saved-filters.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { getContentActionFlags } from '~/utils/permissions/author/get-content-action-flags.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'
import { resolveDefaultFilter } from '~/utils/resolve-default-filter.server'

import { getMissingArticleContent } from '../article/_index/utils/get-missing-article-content'
import { buildArticlePermissionWhere } from '../utils/build-article-permission-where'
import { formatEditHoldLine } from '../utils/format-edit-hold-line'
import { getArticleFactLine } from '../utils/get-article-fact-line'
import { getArticleHold } from '../utils/get-article-hold'
import { getHeldActionFlags } from '../utils/get-held-action-flags'
import { getRowActions } from '../utils/get-row-actions'
import type { Route } from './+types/route'
import { PINNED_ROWS_PARAM } from './pinned-rows'
import { SORT_KEYS, type SortKey } from './sort'
import { getBulkActions } from './utils/get-bulk-actions'

const PAGE_SIZE = 20

const TABLE_KEY = 'articles'

// Each sort appends `createdAt desc` as a tie-breaker so rows with equal values
// keep a deterministic order (matters most here — the list is paginated, so
// unstable ordering could shuffle items across pages).
const ORDER_BY: Record<
  SortKey,
  (order: SortOrder) => Prisma.ArticleOrderByWithRelationInput[]
> = {
  title: (order) => [{ title: order }, { createdAt: 'desc' }],
  updatedAt: (order) => [{ updatedAt: order }, { createdAt: 'desc' }],
}

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
    entities: ['article'],
  })

  // A live load of the rows on screen (22f): fresh data for exactly those rows,
  // whatever the order, filters or page now say. A fetcher load, so it never
  // redirects.
  const pinnedIds = url.searchParams
    .get(PINNED_ROWS_PARAM)
    ?.split(',')
    .filter((id) => id !== '')
    .slice(0, PAGE_SIZE)
  const isPinned = pinnedIds !== undefined

  // Before any query: a bare visit with a default preset never renders this list,
  // it redirects to the preset's own URL.
  if (!isPinned) {
    await resolveDefaultFilter({
      tableKey: TABLE_KEY,
      url,
      userId: context.userId,
    })
  }

  const { order, page, query, sort } = parseAdminListParams(request, {
    defaultOrder: 'desc',
    defaultSort: 'updatedAt',
    sortKeys: SORT_KEYS,
  })

  const filters = parseAdminListFilters(request, TABLE_KEY)

  // States the current role may view, scoped to own content where access is `own`.
  const permissionWhere = buildArticlePermissionWhere(context)

  // Filters are ANDed with the permission clause, so they only ever narrow what
  // the role may view — `?state=draft` still yields own drafts only. Within one
  // filter its values are alternatives, across filters they all apply (22d).
  const filterConditions: Prisma.ArticleWhereInput[] = [
    ...(filters.state === undefined
      ? []
      : [{ OR: filters.state.map(buildContentQueueWhere) }]),
    ...(filters.category === undefined
      ? []
      : [{ categories: { some: { slug: { in: filters.category } } } }]),
    ...(filters.tag === undefined
      ? []
      : [{ tags: { some: { slug: { in: filters.tag } } } }]),
    // Authors are many-to-many, there is no authorId on Article — hence the id.
    ...(filters.author === undefined
      ? []
      : [{ authors: { some: { id: { in: filters.author } } } }]),
  ]

  // Shared by findMany and count, so totals and page counts follow the filters.
  // The query matches the title or the slug — public URLs expose the slug.
  const where: Prisma.ArticleWhereInput = {
    AND: [
      permissionWhere,
      ...(query === ''
        ? []
        : [
            {
              OR: [
                { title: { contains: query } },
                { slug: { contains: query } },
              ],
            },
          ]),
      ...filterConditions,
    ],
  }

  // Filter options are deliberately NOT permission-scoped: they must be the same
  // for everyone so a filter URL can be shared without side effects. Scoping them
  // per viewer would make a value the viewer cannot see anywhere count as stale
  // and silently reset. Permissions still apply to the rows — an option a role
  // cannot see simply yields an empty list. `some: {}` only drops values with no
  // article at all, which could never match anything.
  const withAnyArticle = { articles: { some: {} } }

  // A Contributor sends articles but approves nothing: Odeslané instead of
  // Ke schválení and Schválené (22i).
  const isContributor = context.roleName === 'contributor'
  // The values of the role's Stav menu, in its order.
  const offeredQueues = isContributor
    ? CONTRIBUTOR_STATE_FILTER_QUEUES
    : STATE_FILTER_QUEUES

  // The page of the list, or the rows on screen for a live load (22f).
  const rowsQuery: Pick<Prisma.ArticleFindManyArgs, 'skip' | 'take' | 'where'> =
    isPinned
      ? { where: { AND: [permissionWhere, { id: { in: pinnedIds } }] } }
      : { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, where }

  const [
    rawArticles,
    totalCount,
    authors,
    categories,
    tags,
    savedFilters,
    queueCounts,
  ] = await Promise.all([
    prisma.article.findMany({
      orderBy: ORDER_BY[sort](order),
      select: {
        authors: {
          select: { id: true, name: true, role: { select: { level: true } } },
        },
        categories: {
          orderBy: { name: 'asc' },
          select: { name: true, slug: true },
        },
        // Completeness before bulk publishing (23h, 22c).
        content: true,
        // „upravuje …“ while someone edits it (22f).
        heldByAuthor: { select: { name: true } },
        heldByAuthorId: true,
        heldByTabId: true,
        heldSince: true,
        heldUntil: true,
        id: true,
        images: { select: { altText: true } },
        perex: true,
        publishedAt: true,
        reviews: {
          select: {
            createdAt: true,
            reviewer: {
              select: { id: true, role: { select: { level: true } } },
            },
          },
        },
        slug: true,
        state: true,
        submittedAt: true,
        title: true,
        updatedAt: true,
      },
      ...rowsQuery,
    }),
    prisma.article.count({ where }),
    prisma.author.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
      where: withAnyArticle,
    }),
    prisma.articleCategory.findMany({
      orderBy: { name: 'asc' },
      select: { name: true, slug: true },
      where: withAnyArticle,
    }),
    prisma.articleTag.findMany({
      orderBy: { name: 'asc' },
      select: { name: true, slug: true },
      where: withAnyArticle,
    }),
    loadSavedFilters({ tableKey: TABLE_KEY, url, userId: context.userId }),
    // The Stav menu counts work within what the role may view, whatever else
    // is searched or filtered (22d).
    countContentQueues(isContributor, (queue) =>
      prisma.article.count({
        where: { AND: [permissionWhere, buildContentQueueWhere(queue)] },
      }),
    ),
  ])

  const authorOptions = authors.map((author) => ({
    label: author.name,
    value: author.id,
  }))
  const categoryOptions = categories.map((category) => ({
    label: category.name,
    value: category.slug,
  }))
  const tagOptions = tags.map((tag) => ({ label: tag.name, value: tag.slug }))

  // Category, tag and author are data-driven and can go stale between two
  // visits; a state the role's menu does not offer (a Coordinator's link opened
  // by a Contributor) drops the same way, or it would filter unseen. Checked
  // after the queries so the common path stays a single round trip — a stale
  // value or a hand-written order is rare and costs one extra request.
  const staleFilterRedirect = buildStaleFilterRedirect(url, {
    author: authorOptions,
    category: categoryOptions,
    state: offeredQueues.map((queue) => ({ value: queue })),
    tag: tagOptions,
  })

  if (staleFilterRedirect !== null && !isPinned) {
    throw redirect(staleFilterRedirect)
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Deleting the last row on the last page revalidates a URL past the end. Checked
  // after the stale-filter redirect, which already drops the page.
  if (isPagePastLast(page, totalPages) && !isPinned) {
    throw redirect(buildLastPageRedirect(url, totalPages))
  }

  const now = new Date()

  const isApprover = context.roleLevel <= APPROVER_ROLE_LEVEL

  const articles = rawArticles.map((article) => {
    const unheldFlags = getContentActionFlags(context, 'article', article)
    const hold = getArticleHold(article, { authorId: context.authorId, now })
    const isHeldByOther = hold !== null && !hold.isOwn
    // While someone else edits it, its edit and state actions wait (07g); the
    // Coordinator's Upravit opens the takeover (22f, 24g).
    const flags = getHeldActionFlags(unheldFlags, {
      isApprover,
      isHeldByOther,
    })

    // A filtered category first, so the row shows why it is there; else the
    // alphabetical first (22a).
    const isFilteredCategory = (category: { slug: string }) =>
      filters.category?.includes(category.slug) ?? false
    const categoryNames = [
      ...article.categories.filter(isFilteredCategory),
      ...article.categories.filter((category) => !isFilteredCategory(category)),
    ].map((category) => category.name)

    const submission = flags.submission?.state ?? null
    const rowActions = getRowActions({
      ...flags,
      canEdit: flags.canEdit || flags.canTakeOver,
      state: article.state,
      submission,
    })

    return {
      ...rowActions,
      authorNames: article.authors.map((author) => author.name),
      // What the selection bar may apply to this row (22c); a held one is
      // skipped and said apart (22f), not left out of the bar's actions.
      bulkActions: getBulkActions({
        ...getRowActions({ ...unheldFlags, state: article.state, submission }),
        isApprover,
      }),
      categoryNames,
      factLine: getArticleFactLine({
        now,
        publishedAt: article.publishedAt,
        state: article.state,
        submission: flags.submission,
        updatedAt: article.updatedAt,
      }),
      heldUntil: hold?.heldUntil.toISOString() ?? null,
      // Who edits it, ahead of the fact and of a live change (22f, 2txmjnaq);
      // the list looks again when it should expire.
      holdLine:
        hold === null
          ? null
          : formatEditHoldLine({
              holderName: hold.heldByName,
              isOwn: hold.isOwn,
              now,
            }),
      id: article.id,
      isHeldByOther,
      // Bulk publishing skips it and says so up front (23h, 22c).
      isIncomplete:
        getMissingArticleContent({
          authorCount: article.authors.length,
          content: article.content,
          images: article.images,
          perex: article.perex,
          slug: article.slug,
          title: article.title,
        }).length > 0,
      // Publishing it, the dialog says nobody submitted it (23f).
      isNotSubmitted:
        article.state === 'draft' &&
        flags.submission === null &&
        flags.isSubmittable &&
        !flags.isOwnContent,
      publishedAt: article.publishedAt?.toISOString() ?? null,
      slug: article.slug,
      state: flags.submission?.state ?? article.state,
      title: article.title,
      updatedAt: formatNumericDate(article.updatedAt),
    }
  })

  // Read only here: an earlier redirect must not use up the toast (23f).
  const notice = await readAdminNotice(request)

  return data(
    {
      ...savedFilters,
      articles,
      // Whose live changes are not someone else's (22f).
      authorId: context.authorId,
      authorOptions,
      canCreate: context.can({
        action: 'create',
        entity: 'article',
        state: 'draft',
        targetAuthorIds: [context.authorId],
      }).hasPermission,
      categoryOptions,
      currentPage: page,
      filters,
      isApprover: context.roleLevel <= APPROVER_ROLE_LEVEL,
      isContributor,
      pageSize: PAGE_SIZE,
      // What waits for the Coordinator's approval, whatever is filtered (22a).
      pendingCount:
        queueCounts.find((entry) => entry.queue === 'pending')?.count ?? 0,
      query,
      queueCounts,
      tagOptions,
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
