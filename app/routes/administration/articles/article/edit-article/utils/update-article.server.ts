import type { Prisma } from '@generated/prisma/client'
import { createId } from '@paralleldrive/cuid2'
import { data } from 'react-router'
import type { FeaturedImage } from '~/config/featured-image-config'
import { FEATURED_IMAGE_SOURCE } from '~/config/featured-image-config'
import {
  buildArticleFeaturedImageSeo,
  resolveArticleFeaturedImageSeo,
} from '~/routes/administration/articles/utils/resolve-article-featured-image-seo.server'
import { recordContentLog } from '~/utils/content-log/record-content-log.server'
import { prisma } from '~/utils/db.server'
import { buildHeldByTabWhere } from '~/utils/edit-hold/build-held-by-tab-where'
import type { EditHoldColumns } from '~/utils/edit-hold/edit-hold-columns'
import { getEditHoldStatus } from '~/utils/edit-hold/get-edit-hold-status'
import { isRecordNotFoundError } from '~/utils/edit-hold/is-record-not-found-error.server'
import {
  deleteRowWithImages,
  prepareCoverReplacement,
  storeImageVariants,
} from '~/utils/image-store/store-image.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'
import { checkAuthorPermission } from '~/utils/permissions/author/guards/check-author-permission.server'
import { isLockedBySubmission } from '~/utils/permissions/author/submission/is-locked-by-submission'
import { publishContentEvent } from '~/utils/sse/publish-content-event.server'

type Options = {
  articleId: string
  authorIds: string[]
  categoryIds?: string[]
  content: string
  excerpt?: string
  existingImages?: Array<{
    id: string
    altText: string
    description?: string
    file?: File
  }>
  featuredImage: FeaturedImage
  images?: Array<{ file: File; altText: string; description?: string }>
  slug: string
  tagIds?: string[]
  title: string
  /** The editor's tab, which must hold the edit hold (decision 0019). */
  tabId: string
}

type UpdateArticleResult =
  | { status: 'saved' }
  /** The tab does not hold the article; `heldByName` is who does, if anyone. */
  | { status: 'not-held'; heldByName: string | null }

type StoredHold = EditHoldColumns & {
  heldByAuthor: { name: string } | null
}

const RELEASED_HOLD = {
  heldByAuthorId: null,
  heldByTabId: null,
  heldSince: null,
  heldUntil: null,
}

/**
 * Saves an edit of an article. The permission is checked against the stored
 * authors and state, never against the ones the form sends, and the new
 * authors must be ones the editor may set. An edit never changes the state.
 * Only the tab holding the edit hold saves, checked again in the save's own
 * write (decision 0019); *Uložit* closes the editor, so the save releases the
 * hold. The history gets one *Upraveno* per hold (07f). The caller has checked
 * the session (`checkCSRF`).
 *
 * @param request - The action's request.
 * @param options - The article id, the editor's tab and the edited fields.
 * @returns `saved`, or `not-held` with the holder's name when another tab or
 *   someone else holds the article (nothing is written).
 * @throws A 404 response for a missing article, a 403 response for a denied
 *   edit, a locked submission or authors the editor may not set.
 */
export async function updateArticle(
  request: Request,
  {
    articleId,
    authorIds,
    categoryIds,
    content,
    excerpt,
    existingImages,
    featuredImage,
    images,
    slug,
    tagIds,
    tabId,
    title,
  }: Options,
): Promise<UpdateArticleResult> {
  const storedArticle = await prisma.article.findUnique({
    select: {
      authors: { select: { id: true } },
      firstContentAt: true,
      heldByAuthor: { select: { name: true } },
      heldByAuthorId: true,
      heldByTabId: true,
      heldSince: true,
      heldUntil: true,
      slug: true,
      state: true,
      submittedAt: true,
    },
    where: { id: articleId },
  })

  if (storedArticle === null) {
    throw data(null, { status: 404 })
  }

  const { state } = storedArticle

  return withAuthorPermission(request, {
    action: 'update',
    entity: 'article',
    execute: async (context): Promise<UpdateArticleResult> => {
      // A submitted article is locked for its authors (design 07d).
      if (
        isLockedBySubmission({
          roleLevel: context.roleLevel,
          submittedAt: storedArticle.submittedAt,
        })
      ) {
        throw data(null, { status: 403 })
      }

      const tab = { authorId: context.authorId, tabId }

      // Who holds it instead of this tab (another tab of one's own included).
      const toNotHeld = (hold: StoredHold | null): UpdateArticleResult => ({
        heldByName:
          hold === null ||
          getEditHoldStatus(hold, { ...tab, now: new Date() }) === 'free'
            ? null
            : (hold.heldByAuthor?.name ?? null),
        status: 'not-held',
      })

      // Checked before any image is stored, so a refused save stores nothing;
      // the save's own write checks it again.
      if (
        storedArticle.heldByAuthorId !== tab.authorId ||
        storedArticle.heldByTabId !== tab.tabId
      ) {
        return toNotHeld(storedArticle)
      }

      // Setting the authors needs the permission for the new ones too.
      checkAuthorPermission(context, {
        action: 'update',
        entity: 'article',
        state,
        targetAuthorIds: authorIds,
      })

      // 1. Find images no longer in the form; their rows and files go last.
      const existingImageIds =
        existingImages?.map((existingImage) => existingImage.id) ?? []

      const removedImages = await prisma.articleImage.findMany({
        select: { id: true },
        where: { articleId, id: { notIn: existingImageIds } },
      })
      const removedImageIds = removedImages.map(({ id }) => id)

      // 2. Store new images' variants (files before the rows commit); they
      // go after the existing ones in the gallery (design 24b).
      const { _max: lastImage } = await prisma.articleImage.aggregate({
        _max: { position: true },
        where: { articleId },
      })
      const firstNewPosition = (lastImage.position ?? -1) + 1
      const newImages = await Promise.all(
        (images ?? []).map(async ({ file, altText, description }, index) => {
          const id = createId()
          const meta = await storeImageVariants(id, file)
          return {
            ...meta,
            altText,
            description: description || null,
            id,
            position: firstNewPosition + index,
          }
        }),
      )

      // 3. Store replaced files of existing images; the previous version's
      // files are dropped only after the transaction commits.
      const previousVersions = await prisma.articleImage.findMany({
        select: { id: true, version: true },
        where: { id: { in: existingImageIds } },
      })
      const updatedImages = await Promise.all(
        (existingImages ?? []).map(
          async ({ id, altText, description, file }) => {
            const { data, cleanup } = await prepareCoverReplacement({
              altText,
              coverId: id,
              file: file !== undefined && file.size > 0 ? file : undefined,
              previousVersion:
                previousVersions.find((previous) => previous.id === id)
                  ?.version ?? null,
            })
            return {
              cleanup,
              data: { ...data, description: description || null },
              id,
            }
          },
        ),
      )

      // 4. Determine featured image ID
      let featuredImageId: string | null = null
      if (featuredImage.source === FEATURED_IMAGE_SOURCE.EXISTING) {
        featuredImageId = featuredImage.id
      } else if (
        featuredImage.source === FEATURED_IMAGE_SOURCE.NEW &&
        newImages[featuredImage.index]
      ) {
        featuredImageId = newImages[featuredImage.index].id
      }

      // A new or replaced featured image isn't in the DB yet: build its SEO
      // URLs from the stored metadata instead of reading the row.
      const storedImages = [
        ...newImages,
        ...updatedImages.flatMap(({ id, data: { version, intrinsicWidth } }) =>
          version !== undefined && intrinsicWidth !== undefined
            ? [{ id, intrinsicWidth, version }]
            : [],
        ),
      ]
      const pendingFeaturedImage = storedImages.find(
        (image) => image.id === featuredImageId,
      )

      const { ogImageUrl, twitterImageUrl } =
        pendingFeaturedImage !== undefined
          ? await buildArticleFeaturedImageSeo({
              imageId: pendingFeaturedImage.id,
              intrinsicWidth: pendingFeaturedImage.intrinsicWidth,
              version: pendingFeaturedImage.version,
            })
          : await resolveArticleFeaturedImageSeo(featuredImageId)

      const pathname = `/articles/${slug}`
      // The PageSEO row moves with the address; a draft without one has none.
      const storedPathname =
        storedArticle.slug === null
          ? pathname
          : `/articles/${storedArticle.slug}`

      // The first save with a title, text or image ends the empty draft and
      // is its creation in the history (decision 0020, design 07f).
      const hasContent =
        title !== '' ||
        content !== '' ||
        newImages.length > 0 ||
        existingImageIds.length > 0

      // 5. In one transaction: all image rows, the article and its PageSEO
      // record. Store files of removed images and of replaced versions go only
      // after it commits, so a failed save leaves everything as it was.
      const saveInTransaction = () =>
        deleteRowWithImages(
          async () => removedImageIds,
          () =>
            prisma.$transaction([
              // Conditional, so of two first saves only one is the creation.
              prisma.article.updateMany({
                data: { firstContentAt: hasContent ? new Date() : null },
                where: { firstContentAt: null, id: articleId },
              }),
              // An orphan left at the new address by an earlier rename.
              prisma.pageSEO.deleteMany({
                where: {
                  AND: [{ pathname }, { pathname: { not: storedPathname } }],
                },
              }),
              prisma.articleImage.deleteMany({
                where: { id: { in: removedImageIds } },
              }),
              ...newImages.map((imageData) =>
                prisma.articleImage.create({
                  data: { ...imageData, articleId },
                  select: { id: true },
                }),
              ),
              ...updatedImages.map(({ id, data }) =>
                prisma.articleImage.update({ data, where: { id } }),
              ),
              prisma.article.update({
                data: {
                  authors: {
                    set: authorIds.map((id) => ({ id })),
                  },
                  categories: {
                    set: categoryIds?.map((id) => ({ id })) ?? [],
                  },
                  content,
                  excerpt: excerpt || null,
                  featuredImageId,
                  slug,
                  tags: {
                    set: tagIds?.map((id) => ({ id })) ?? [],
                  },
                  title,
                  // *Uložit* closes the editor (until autosave, #670).
                  ...RELEASED_HOLD,
                },
                select: { id: true },
                // Only the holding tab saves a draft (decision 0019); otherwise
                // the whole transaction rolls back.
                where: {
                  id: articleId,
                  state: 'draft',
                  ...buildHeldByTabWhere(tab),
                },
              }),
              prisma.pageSEO.upsert({
                create: {
                  authorId: context.authorId,
                  description: excerpt || null,
                  ogImageUrl,
                  pathname,
                  state,
                  title,
                  twitterImageUrl,
                },
                // The state belongs to the state transitions, not to an edit.
                update: {
                  description: excerpt || null,
                  ogImageUrl,
                  pathname,
                  title,
                  twitterImageUrl,
                },
                where: { pathname: storedPathname },
              }),
            ]),
        ) as Promise<[Prisma.BatchPayload, ...unknown[]]>

      let firstContent: Prisma.BatchPayload

      try {
        ;[firstContent] = await saveInTransaction()
      } catch (error) {
        // The hold moved between the check and the write.
        if (!isRecordNotFoundError(error)) throw error

        return toNotHeld(
          await prisma.article.findUnique({
            select: {
              heldByAuthor: { select: { name: true } },
              heldByAuthorId: true,
              heldByTabId: true,
              heldSince: true,
              heldUntil: true,
            },
            where: { id: articleId },
          }),
        )
      }

      await Promise.all(updatedImages.map(({ cleanup }) => cleanup()))

      const change =
        hasContent && firstContent.count === 1 ? 'create' : 'update'

      // A save that leaves a draft empty stays out of its history (0020).
      if (!hasContent && storedArticle.firstContentAt === null) {
        return { status: 'saved' }
      }

      // One *Upraveno* per hold, however often it saves (07f, 24e).
      const isLoggedInThisHold =
        change === 'update' &&
        storedArticle.heldSince !== null &&
        (await prisma.contentLog.count({
          where: {
            actorId: context.authorId,
            createdAt: { gte: storedArticle.heldSince },
            entity: 'article',
            entityId: articleId,
            event: { in: ['create', 'update'] },
          },
        })) > 0

      if (!isLoggedInThisHold) {
        await recordContentLog(
          { entity: 'article', entityId: articleId, events: [change] },
          context,
        )
      }

      publishContentEvent(
        { change, entity: 'article', entityId: articleId },
        context,
      )

      return { status: 'saved' }
    },
    target: {
      authorIds: storedArticle.authors.map((author) => author.id),
      state,
    },
  })
}
