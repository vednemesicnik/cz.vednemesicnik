import { data, href, redirect } from 'react-router'

import { readAdminNotice } from '~/utils/admin-notice/read-admin-notice.server'
import { getContentHistory } from '~/utils/content-log/get-content-history.server'
import { prisma } from '~/utils/db.server'
import { createFormattedDate } from '~/utils/format-date'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { getContentActionFlags } from '~/utils/permissions/author/get-content-action-flags.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'

import { findPublishedSlugConflict } from '../../utils/find-published-slug-conflict.server'
import { formatEditHoldLine } from '../../utils/format-edit-hold-line'
import { getArticleFactLine } from '../../utils/get-article-fact-line'
import { getArticleHold } from '../../utils/get-article-hold'
import { getHeldActionFlags } from '../../utils/get-held-action-flags'
import type { Route } from './+types/route'
import { getMissingArticleContent } from './utils/get-missing-article-content'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { articleId } = params

  const context = await getAuthorPermissionContext(request, {
    actions: [
      'view',
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

  const article = await prisma.article.findUnique({
    select: {
      authors: {
        select: {
          id: true,
          name: true,
          role: {
            select: {
              level: true,
            },
          },
        },
      },
      categories: {
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
        },
      },
      content: true,
      createdAt: true,
      featuredImage: {
        select: {
          ...imageSourceSelect,
          description: true,
        },
      },
      firstContentAt: true,
      heldByAuthor: { select: { name: true } },
      heldByAuthorId: true,
      heldByTabId: true,
      heldSince: true,
      heldUntil: true,
      id: true,
      images: {
        select: { altText: true },
      },
      perex: true,
      publishedAt: true,
      reviews: {
        select: {
          createdAt: true,
          reviewer: { select: { id: true, role: { select: { level: true } } } },
        },
      },
      slug: true,
      state: true,
      submittedAt: true,
      tags: {
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
        },
      },
      title: true,
      updatedAt: true,
    },
    where: { id: articleId },
  })

  if (!article) {
    throw new Response('Článek nenalezen', { status: 404 })
  }

  if (article.authors.length === 0) {
    throw new Response('Článek nemá přiřazeného autora', { status: 500 })
  }

  const targetAuthorIds = article.authors.map((author) => author.id)

  // Check view permission
  const { hasPermission: canView } = context.can({
    action: 'view',
    entity: 'article',
    state: article.state,
    targetAuthorIds,
  })

  // A record the person may not see is a 404, like a deleted one (design 30e).
  if (!canView) {
    throw data(null, { status: 404 })
  }

  // An empty draft has no detail yet (log 0020): its editor is the page.
  if (article.firstContentAt === null) {
    throw redirect(
      href('/administration/articles/:articleId/edit-article', { articleId }),
    )
  }

  const now = new Date()
  const isApprover = context.roleLevel <= APPROVER_ROLE_LEVEL
  const hold = getArticleHold(article, { authorId: context.authorId, now })
  const isHeldByOther = hold !== null && !hold.isOwn

  // While someone else edits it, its edit and state actions wait (07g); the
  // transitions check it again in their own writes.
  const flags = getHeldActionFlags(
    getContentActionFlags(context, 'article', article),
    { isApprover, isHeldByOther },
  )

  // Publishing an incomplete article opens the 23h list instead of the date
  // dialog; the server checks it again.
  const missingBeforePublish = flags.canPublish
    ? getMissingArticleContent({
        authorCount: article.authors.length,
        content: article.content,
        images: article.images,
        isSlugTaken:
          (await findPublishedSlugConflict({
            articleId,
            slug: article.slug,
          })) !== null,
        perex: article.perex,
        slug: article.slug,
        title: article.title,
      })
    : []

  // Read only here: an earlier redirect must not use up the toast (23g).
  const notice = await readAdminNotice(request)

  return data(
    {
      article: {
        authors: article.authors,
        categories: article.categories,
        content: article.content,
        // The line under the title (design 22b, 23a); who edits it while held
        // (23g).
        factLine:
          hold === null
            ? getArticleFactLine({
                now,
                publishedAt: article.publishedAt,
                state: article.state,
                submission: flags.submission,
                updatedAt: article.updatedAt,
              })
            : formatEditHoldLine({
                holderName: hold.heldByName,
                isOwn: hold.isOwn,
                now,
                since: hold.heldSince,
              }),
        featuredImage: article.featuredImage
          ? {
              altText: article.featuredImage.altText,
              description: article.featuredImage.description,
              sources: createImageSources(
                'article-image',
                article.featuredImage,
              ),
            }
          : null,
        history: await getContentHistory({
          createdAt: article.createdAt,
          entity: 'article',
          entityId: article.id,
          publishedAt: article.publishedAt,
        }),
        id: article.id,
        // The gallery is the editor's (24); the detail shows only the count (23a).
        imageCount: article.images.length,
        perex: article.perex,
        // FormattedDate carries the raw instant in `.iso`, which seeds the
        // change-date dialog's picker (the browser converts it to/from local time,
        // keeping the default and submitted value in the editor's timezone).
        publishedAt: createFormattedDate(article.publishedAt),
        slug: article.slug,
        state: article.state,
        tags: article.tags,
        title: article.title,
      },
      ...flags,
      // „Článek právě upravuje …“ in place of the buttons (23g), and when the
      // page looks again: an expiry sends no event.
      heldByName: isHeldByOther ? hold.heldByName : null,
      heldUntil: hold?.heldUntil.toISOString() ?? null,
      // Only the Coordinator publishes a retracted article again (23e).
      isApprover,
      isHeldByOther,
      // One's own editor in another tab: Smazat… waits and says so (23g, 0036).
      isHeldInOwnOtherTab: hold?.isOwn === true,
      missingBeforePublish,
      submission: flags.submission?.state ?? null,
      // „Článek právě upravuje …“ after a direct address of its editor (23g).
      toast: notice.toast,
    },
    notice.toast === null
      ? undefined
      : { headers: { 'Set-Cookie': notice.setCookie } },
  )
}
