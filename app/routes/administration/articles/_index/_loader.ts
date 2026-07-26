import type { Prisma } from '@generated/prisma/client'
import { redirect } from 'react-router'

import {
  buildStaleFilterRedirect,
  parseAdminListFilters,
} from '~/utils/admin-list-filters'
import { parseAdminListParams, type SortOrder } from '~/utils/admin-list-params'
import { prisma } from '~/utils/db.server'
import { loadSavedFilters } from '~/utils/load-saved-filters.server'
import { buildViewableStateFilters } from '~/utils/permissions/author/build-viewable-state-filters'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { resolveDefaultFilter } from '~/utils/resolve-default-filter.server'

import type { Route } from './+types/route'
import { SORT_KEYS, type SortKey } from './sort'

const PAGE_SIZE = 20

const TABLE_KEY = 'articles'

// Non-createdAt sorts append `createdAt desc` as a tie-breaker so rows with
// equal values keep a deterministic order (matters most here — the list is
// paginated, so unstable ordering could shuffle items across pages).
const ORDER_BY: Record<
  SortKey,
  (order: SortOrder) => Prisma.ArticleOrderByWithRelationInput[]
> = {
  createdAt: (order) => [{ createdAt: order }],
  title: (order) => [{ title: order }, { createdAt: 'desc' }],
}

export const loader = async ({ request, url }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['view', 'create', 'update', 'delete'],
    entities: ['article'],
  })

  // Before any query: a bare visit with a default preset never renders this list,
  // it redirects to the preset's own URL.
  await resolveDefaultFilter({
    tableKey: TABLE_KEY,
    url,
    userId: context.userId,
  })

  // Check view permissions for each state
  const draftPerms = context.can({
    action: 'view',
    entity: 'article',
    state: 'draft',
  })
  const publishedPerms = context.can({
    action: 'view',
    entity: 'article',
    state: 'published',
  })
  const archivedPerms = context.can({
    action: 'view',
    entity: 'article',
    state: 'archived',
  })

  const { order, page, query, sort } = parseAdminListParams(request, {
    defaultOrder: 'desc',
    defaultSort: 'createdAt',
    sortKeys: SORT_KEYS,
  })

  const filters = parseAdminListFilters(request, TABLE_KEY)

  // States the current role may view, scoped to own content where access is `own`.
  const viewableStates = buildViewableStateFilters(
    [
      { rights: draftPerms, state: 'draft' },
      { rights: publishedPerms, state: 'published' },
      { rights: archivedPerms, state: 'archived' },
    ],
    { authors: { some: { id: context.authorId } } },
  )

  const permissionWhere: Prisma.ArticleWhereInput = { OR: viewableStates }

  // Field filters are ANDed with the permission clause, so they only ever narrow
  // what the role may view — `?state=draft` still yields own drafts only.
  const filterConditions: Prisma.ArticleWhereInput[] = [
    ...(filters.state === undefined ? [] : [{ state: filters.state }]),
    ...(filters.category === undefined
      ? []
      : [{ categories: { some: { slug: filters.category } } }]),
    ...(filters.tag === undefined
      ? []
      : [{ tags: { some: { slug: filters.tag } } }]),
    // Authors are many-to-many, there is no authorId on Article — hence the id.
    ...(filters.author === undefined
      ? []
      : [{ authors: { some: { id: filters.author } } }]),
  ]

  // Shared by findMany and count, so totals and page counts follow the filters.
  const where: Prisma.ArticleWhereInput = {
    AND: [
      permissionWhere,
      ...(query === '' ? [] : [{ title: { contains: query } }]),
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

  const [rawArticles, totalCount, authors, categories, tags, savedFilters] =
    await Promise.all([
      prisma.article.findMany({
        orderBy: ORDER_BY[sort](order),
        select: {
          authors: { select: { id: true } },
          createdAt: true,
          id: true,
          state: true,
          title: true,
        },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        where,
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

  // `state` is enum-backed, so the schema already validates it; the rest is
  // data-driven and can go stale between two visits. Checked after the queries
  // so the common path stays a single round trip — a stale value is rare and
  // costs one extra request.
  const staleFilterRedirect = buildStaleFilterRedirect(url, {
    author: authorOptions,
    category: categoryOptions,
    tag: tagOptions,
  })

  if (staleFilterRedirect !== null) {
    throw redirect(staleFilterRedirect)
  }

  // Compute permissions for each article
  const articles = rawArticles.map((article) => {
    if (article.authors.length === 0) {
      return {
        ...article,
        canDelete: false,
        canEdit: false,
        canView: false,
      }
    }

    const targetAuthorIds = article.authors.map((a) => a.id)

    return {
      ...article,
      canDelete: context.can({
        action: 'delete',
        entity: 'article',
        state: article.state,
        targetAuthorIds,
      }).hasPermission,
      canEdit: context.can({
        action: 'update',
        entity: 'article',
        state: article.state,
        targetAuthorIds,
      }).hasPermission,
      canView: context.can({
        action: 'view',
        entity: 'article',
        state: article.state,
        targetAuthorIds,
      }).hasPermission,
    }
  })

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return {
    ...savedFilters,
    articles,
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
    pageSize: PAGE_SIZE,
    query,
    tagOptions,
    totalCount,
    totalPages,
  }
}
