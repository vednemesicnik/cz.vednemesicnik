import { data, href, redirect } from 'react-router'

import { flashAdminNotice } from '~/utils/admin-notice/flash-admin-notice.server'
import { readCreatedAuthor } from '~/utils/created-author/read-created-author.server'
import { prisma } from '~/utils/db.server'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { requireContentUpdatePermission } from '~/utils/permissions/author/guards/require-content-update-permission.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'
import { getSubmissionState } from '~/utils/permissions/author/submission/get-submission-state'
import { isLockedBySubmission } from '~/utils/permissions/author/submission/is-locked-by-submission'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'

import { canChooseRecordAuthor } from '../../utils/can-choose-record-author'
import { getArticleHold } from '../../utils/get-article-hold'
import type { Route } from './+types/route'
import { getAuthorOptions } from './utils/get-author-options.server'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { articleId } = params

  const context = await getAuthorPermissionContext(request, {
    actions: ['view', 'update'],
    entities: ['article'],
  })

  // Load the article
  const article = await prisma.article.findUnique({
    select: {
      authors: {
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      },
      categories: {
        select: { id: true },
      },
      content: true,
      featuredImage: {
        select: { id: true },
      },
      firstContentAt: true,
      heldByAuthor: { select: { name: true } },
      heldByAuthorId: true,
      heldByTabId: true,
      heldSince: true,
      heldUntil: true,
      images: {
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
        select: {
          ...imageSourceSelect,
          description: true,
          fileName: true,
        },
      },
      perex: true,
      reviews: {
        select: {
          createdAt: true,
          reviewer: { select: { role: { select: { level: true } } } },
        },
      },
      slug: true,
      state: true,
      submittedAt: true,
      tags: {
        select: { id: true },
      },
      title: true,
      updatedAt: true,
    },
    where: { id: articleId },
  })

  if (!article) {
    throw data('Article not found', { status: 404 })
  }

  requireContentUpdatePermission(context, {
    authorIds: article.authors.map((author) => author.id),
    id: articleId,
    kind: 'article',
    state: article.state,
    title: article.title,
  })

  // A submitted article is locked for its authors until they take it back
  // (design 07d). Design 30d has no reason for it yet, so the generic 403 (30h).
  if (
    isLockedBySubmission({
      roleLevel: context.roleLevel,
      submittedAt: article.submittedAt,
    })
  ) {
    throw data(null, { status: 403 })
  }

  const isApprover = context.roleLevel <= APPROVER_ROLE_LEVEL
  const hold = getArticleHold(article, {
    authorId: context.authorId,
    now: new Date(),
  })

  // Someone else edits it: only the Coordinator gets the takeover dialog; the
  // others go to the detail, which says who (23g, 24g). An empty draft has no
  // detail (0020), so to the list.
  if (hold !== null && !hold.isOwn && !isApprover) {
    throw redirect(
      article.firstContentAt === null
        ? href('/administration/articles')
        : href('/administration/articles/:articleId', { articleId }),
      {
        headers: {
          'Set-Cookie': await flashAdminNotice(
            request,
            `Článek právě upravuje ${hold.heldByName}.`,
          ),
        },
      },
    )
  }

  const categoryIds = article.categories.map((category) => category.id)
  const tagIds = article.tags.map((tag) => tag.id)

  const [authors, categories, tags, userContext, created] = await Promise.all([
    getAuthorOptions(),
    // The published ones to pick from, and the ones the article has in
    // another state, which stay until removed (design 24a, iq3nur0e).
    prisma.articleCategory.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, state: true },
      where: { OR: [{ state: 'published' }, { id: { in: categoryIds } }] },
    }),
    prisma.articleTag.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, state: true },
      where: { OR: [{ state: 'published' }, { id: { in: tagIds } }] },
    }),
    getUserPermissionContext(request, {
      actions: ['create'],
      entities: ['author'],
    }),
    // Back from *Založit autora*, the author to choose (24j, ivyin4kr).
    readCreatedAuthor(request, articleId),
  ])

  const authorIds = article.authors.map((author) => author.id)
  const submission = getSubmissionState(article)

  return data(
    {
      article: {
        authorIds,
        // Whose text it is, over someone else's (24c).
        authorNames: article.authors.map((author) => author.name),
        categoryIds,
        content: article.content,
        featuredImageId: article.featuredImage?.id ?? null,
        // The main image stands first, as on the web (yj2t50dd); one set before
        // that may be stored further on.
        images: [...article.images]
          .sort(
            (first, second) =>
              Number(second.id === article.featuredImage?.id) -
              Number(first.id === article.featuredImage?.id),
          )
          .map((image) => ({
            altText: image.altText,
            description: image.description || '',
            // Older images were stored without it (24b).
            fileName: image.fileName,
            id: image.id,
            previewUrl: createImageSources('article-image', image).src ?? null,
          })),
        // An empty draft (log 0020) has no address and is left for the list.
        isEmptyDraft: article.firstContentAt === null,
        perex: article.perex || '',
        slug: article.slug ?? '',
        // Sent for approval, or approved: the tag and the line of 24c.
        submission:
          submission === null
            ? null
            : { date: submission.date.toISOString(), state: submission.state },
        tagIds,
        title: article.title,
        // The last save, which the editor's hold takes back only over (24i).
        updatedAt: article.updatedAt.toISOString(),
      },
      authors,
      // Without itself and as the association too (24j, log 0026).
      canChooseAuthorsFreely: canChooseRecordAuthor(context.roleLevel),
      // Offered for a name the search does not find (24j, 2re069d4).
      canCreateAuthor: userContext.can({ action: 'create', entity: 'author' })
        .hasPermission,
      categories,
      // The editor adds it, or puts it in place of the replaced author.
      createdAuthor: created.createdAuthor,
      // Only the Coordinator takes over someone else's edit (24g).
      isApprover,
      // One's own text has no sentence over it (24c).
      isOwn: authorIds.includes(context.authorId),
      // Marked *vy*, and kept by whoever does not choose freely (24j).
      ownAuthorId: context.authorId,
      tags,
    },
    created.setCookie === null
      ? undefined
      : { headers: { 'Set-Cookie': created.setCookie } },
  )
}
