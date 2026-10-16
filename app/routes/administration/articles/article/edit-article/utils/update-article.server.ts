import type { Prisma } from '@generated/prisma/client'
import { isCuid } from '@paralleldrive/cuid2'
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
import { getFreeSlugSuggestion } from '~/utils/get-free-slug-suggestion'
import { isImageIdOwnedElsewhere } from '~/utils/image-store/is-image-id-owned-elsewhere.server'
import {
  deleteImage,
  deleteRowWithImages,
  prepareCoverReplacement,
  storeImageVariants,
} from '~/utils/image-store/store-image.server'
import { isUniqueConstraintError } from '~/utils/is-unique-constraint-error.server'
import { mergeLinkedIds } from '~/utils/merge-linked-ids'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'
import { checkAuthorPermission } from '~/utils/permissions/author/guards/check-author-permission.server'
import { isLockedBySubmission } from '~/utils/permissions/author/submission/is-locked-by-submission'
import { publishContentEvent } from '~/utils/sse/publish-content-event.server'

type Options = {
  articleId: string
  authorIds: string[]
  categoryIds?: string[]
  content: string
  perex?: string
  existingImages?: Array<{
    id: string
    altText: string
    description?: string
    file?: File
  }>
  featuredImage: FeaturedImage
  images?: Array<{
    id: string
    file?: File
    altText: string
    description?: string
  }>
  /** Links the editor removed; any other stored one stays (decision 0025). */
  removedCategoryIds?: string[]
  removedTagIds?: string[]
  slug: string
  tagIds?: string[]
  title: string
  /** The editor's tab, which must hold the edit hold (decision 0019). */
  tabId: string
  /** The last save of a page going away also ends its hold. */
  releaseHold?: boolean
}

type UpdateArticleResult =
  /**
   * `slugSuggestion` is a free address offered for a taken one, which was not
   * saved (design 24d); `null` when the address saved.
   */
  | { status: 'saved'; updatedAt: Date; slugSuggestion: string | null }
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
 * Saves the editor's whole article, as autosave sends it (design 24e, decision
 * 0022). The permission is checked against the stored authors and state, never
 * against the ones the form sends, and the new authors must be ones the editor
 * may set. An edit never changes the state. Only the tab holding the edit hold
 * saves, checked again in the save's own write (decision 0019), and the save
 * keeps the hold unless `releaseHold` asks for the end. A draft saves
 * incomplete; an address another article has is left out and the rest saves
 * (24d). A category or a tag goes only when the editor sends it as removed,
 * so an archived one stays (decision 0025). A new image carries the id the
 * editor made for it, so a repeated save stores it once. The history gets one
 * *Upraveno* per hold (07f). The caller has checked the session
 * (`requireCSRF`).
 *
 * @param request - The action's request.
 * @param options - The article id, the editor's tab and the edited fields.
 * @returns `saved` with the new `updatedAt` and a free address for a taken one,
 *   or `not-held` with the holder's name when another tab or someone else holds
 *   the article (nothing is written).
 * @throws A 404 response for a missing article, a 403 response for a denied
 *   edit, a locked submission or authors the editor may not set, a 400
 *   response for an image id that is not the article's.
 */
export async function updateArticle(
  request: Request,
  {
    articleId,
    authorIds,
    categoryIds,
    content,
    perex,
    existingImages,
    featuredImage,
    images,
    removedCategoryIds = [],
    removedTagIds = [],
    slug,
    tagIds,
    tabId,
    title,
    releaseHold = false,
  }: Options,
): Promise<UpdateArticleResult> {
  const storedArticle = await prisma.article.findUnique({
    select: {
      authors: { select: { id: true } },
      categories: { select: { id: true } },
      firstContentAt: true,
      heldByAuthor: { select: { name: true } },
      heldByAuthorId: true,
      heldByTabId: true,
      heldSince: true,
      heldUntil: true,
      slug: true,
      state: true,
      submittedAt: true,
      tags: { select: { id: true } },
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

      // 1. Every image the form names must be this article's (decision
      // 0015): its existing images and the featured one.
      const claimedImageIds = new Set([
        ...(existingImages ?? []).map(({ id }) => id),
        ...(featuredImage.source === FEATURED_IMAGE_SOURCE.EXISTING
          ? [featuredImage.id]
          : []),
      ])
      if (claimedImageIds.size > 0) {
        const ownImages = await prisma.articleImage.count({
          where: { articleId, id: { in: [...claimedImageIds] } },
        })
        if (ownImages !== claimedImageIds.size) {
          throw data(null, { status: 400 })
        }
      }

      // 2. A new image saved before keeps its id (made in the editor), so a
      // repeated or retried save stores it once. An id another article's image
      // or another record's picture has is refused: the store keys files by
      // the id alone (decision 0022).
      const newImageIds = (images ?? []).map(({ id }) => id)

      if (newImageIds.some((id) => !isCuid(id))) {
        throw data(null, { status: 400 })
      }

      const storedNewImages =
        newImageIds.length === 0
          ? []
          : await prisma.articleImage.findMany({
              select: { articleId: true, id: true },
              where: { id: { in: newImageIds } },
            })

      if (storedNewImages.some((image) => image.articleId !== articleId)) {
        throw data(null, { status: 400 })
      }

      const storedNewImageIds = new Set(storedNewImages.map(({ id }) => id))

      if (
        await isImageIdOwnedElsewhere(
          newImageIds.filter((id) => !storedNewImageIds.has(id)),
        )
      ) {
        throw data(null, { status: 400 })
      }

      const keptImages = [
        ...(existingImages ?? []),
        // Saved before: a file still sent is a replacement (a retry stores at
        // most one version more).
        ...(images ?? []).filter(({ id }) => storedNewImageIds.has(id)),
      ]
      const imagesToCreate = (images ?? []).flatMap(({ file, ...image }) =>
        !storedNewImageIds.has(image.id) && file !== undefined && file.size > 0
          ? [{ ...image, file }]
          : [],
      )

      // 3. Find images no longer in the form; their rows and files go last.
      const existingImageIds = keptImages.map((keptImage) => keptImage.id)

      const removedImages = await prisma.articleImage.findMany({
        select: { id: true },
        where: { articleId, id: { notIn: existingImageIds } },
      })
      const removedImageIds = removedImages.map(({ id }) => id)

      // 4. Store new images' variants (files before the rows commit); they
      // go after the existing ones in the gallery (design 24b).
      const { _max: lastImage } = await prisma.articleImage.aggregate({
        _max: { position: true },
        where: { articleId },
      })
      const firstNewPosition = (lastImage.position ?? -1) + 1
      const newImages = await Promise.all(
        imagesToCreate.map(
          async ({ id, file, altText, description }, index) => {
            const meta = await storeImageVariants(id, file)
            return {
              ...meta,
              altText,
              description: description || null,
              id,
              position: firstNewPosition + index,
            }
          },
        ),
      )

      // 5. Store replaced files of existing images; the previous version's
      // files are dropped only after the transaction commits.
      const previousVersions = await prisma.articleImage.findMany({
        select: { id: true, version: true },
        where: { id: { in: existingImageIds } },
      })
      const updatedImages = await Promise.all(
        keptImages.map(async ({ id, altText, description, file }) => {
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
        }),
      )

      // 6. Determine featured image ID
      const savedImageIds = new Set([
        ...existingImageIds,
        ...newImages.map(({ id }) => id),
      ])
      let featuredImageId: string | null = null
      if (featuredImage.source === FEATURED_IMAGE_SOURCE.EXISTING) {
        featuredImageId = featuredImage.id
      } else if (featuredImage.source === FEATURED_IMAGE_SOURCE.NEW) {
        const featuredNewImageId = images?.[featuredImage.index]?.id
        featuredImageId =
          featuredNewImageId !== undefined &&
          savedImageIds.has(featuredNewImageId)
            ? featuredNewImageId
            : null
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

      // 7. An address another article has is not saved; the rest is (24d).
      // Until the author picks another, the article keeps its address, or has
      // none when it is new.
      const findSlugSuggestion = async (requestedSlug: string) => {
        const otherArticles = await prisma.article.findMany({
          select: { slug: true },
          where: {
            id: { not: articleId },
            slug: { startsWith: requestedSlug },
          },
        })
        const takenSlugs = otherArticles.flatMap((otherArticle) =>
          otherArticle.slug === null ? [] : [otherArticle.slug],
        )
        return takenSlugs.includes(requestedSlug)
          ? getFreeSlugSuggestion(requestedSlug, takenSlugs)
          : null
      }

      const requestedSlug = slug === '' ? null : slug
      let slugSuggestion =
        requestedSlug === null || requestedSlug === storedArticle.slug
          ? null
          : await findSlugSuggestion(requestedSlug)

      // 8. A save removes a category or a tag only when the editor sends it
      // as removed, so an archived one it never offered stays (decision
      // 0025, design 24a). An id that names nothing is left out.
      const [existingCategories, existingTags] = await Promise.all([
        prisma.articleCategory.findMany({
          select: { id: true },
          where: { id: { in: categoryIds ?? [] } },
        }),
        prisma.articleTag.findMany({
          select: { id: true },
          where: { id: { in: tagIds ?? [] } },
        }),
      ])
      const linkedCategoryIds = mergeLinkedIds({
        removedIds: removedCategoryIds,
        sentIds: existingCategories.map(({ id }) => id),
        storedIds: storedArticle.categories.map(({ id }) => id),
      })
      const linkedTagIds = mergeLinkedIds({
        removedIds: removedTagIds,
        sentIds: existingTags.map(({ id }) => id),
        storedIds: storedArticle.tags.map(({ id }) => id),
      })

      // The first save with a title, text or image ends the empty draft and
      // is its creation in the history (decision 0020, design 07f).
      const hasContent =
        title !== '' ||
        content !== '' ||
        newImages.length > 0 ||
        existingImageIds.length > 0

      // 9. In one transaction: all image rows, the article and its PageSEO
      // record. Store files of removed images and of replaced versions go only
      // after it commits, so a failed save leaves everything as it was.
      const saveInTransaction = async () => {
        const savedSlug =
          slugSuggestion === null ? requestedSlug : storedArticle.slug
        // The PageSEO row moves with the address; a draft without one has none.
        const pathname = savedSlug === null ? null : `/articles/${savedSlug}`
        const storedPathname =
          storedArticle.slug === null
            ? pathname
            : `/articles/${storedArticle.slug}`

        const pageSeoWrites =
          pathname === null
            ? // A cleared address takes its PageSEO row with it.
              storedPathname === null
              ? []
              : [
                  prisma.pageSEO.deleteMany({
                    where: { pathname: storedPathname },
                  }),
                ]
            : [
                prisma.pageSEO.upsert({
                  create: {
                    authorId: context.authorId,
                    description: perex || null,
                    ogImageUrl,
                    pathname,
                    state,
                    title,
                    twitterImageUrl,
                  },
                  // The state belongs to the state transitions, not to an edit.
                  update: {
                    description: perex || null,
                    ogImageUrl,
                    pathname,
                    title,
                    twitterImageUrl,
                  },
                  where: { pathname: storedPathname ?? pathname },
                }),
              ]

        const orphanWrites =
          pathname === null || storedPathname === null
            ? []
            : [
                // An orphan left at the new address by an earlier rename.
                prisma.pageSEO.deleteMany({
                  where: {
                    AND: [{ pathname }, { pathname: { not: storedPathname } }],
                  },
                }),
              ]

        const articleWrite = prisma.article.update({
          data: {
            authors: {
              set: authorIds.map((id) => ({ id })),
            },
            categories: {
              set: linkedCategoryIds.map((id) => ({ id })),
            },
            content,
            featuredImageId,
            perex: perex || null,
            slug: savedSlug,
            tags: {
              set: linkedTagIds.map((id) => ({ id })),
            },
            title,
            // Autosave keeps the hold; the save of a page going away ends it.
            ...(releaseHold ? RELEASED_HOLD : {}),
          },
          select: { id: true, updatedAt: true },
          // Only the holding tab saves a draft (decision 0019); otherwise
          // the whole transaction rolls back.
          where: {
            id: articleId,
            state: 'draft',
            ...buildHeldByTabWhere(tab),
          },
        })

        const writes = [
          // Conditional, so of two first saves only one is the creation.
          prisma.article.updateMany({
            data: { firstContentAt: hasContent ? new Date() : null },
            where: { firstContentAt: null, id: articleId },
          }),
          ...orphanWrites,
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
          articleWrite,
          ...pageSeoWrites,
        ]
        const articleWriteIndex = writes.indexOf(articleWrite)

        const results = (await deleteRowWithImages(
          async () => removedImageIds,
          () => prisma.$transaction(writes),
        )) as unknown[]

        return {
          firstContent: results[0] as Prisma.BatchPayload,
          savedArticle: results[articleWriteIndex] as { updatedAt: Date },
        }
      }

      let saved: Awaited<ReturnType<typeof saveInTransaction>>

      try {
        try {
          saved = await saveInTransaction()
        } catch (error) {
          // Another article took the address between the check and the write:
          // once more without it.
          if (!isUniqueConstraintError(error) || requestedSlug === null) {
            throw error
          }
          slugSuggestion = await findSlugSuggestion(requestedSlug)
          if (slugSuggestion === null) throw error
          saved = await saveInTransaction()
        }
      } catch (error) {
        // The new images' files went in before the rows, which rolled back.
        await Promise.all(newImages.map(({ id }) => deleteImage(id)))

        if (!isRecordNotFoundError(error)) throw error

        const currentHold = await prisma.article.findUnique({
          select: {
            heldByAuthor: { select: { name: true } },
            heldByAuthorId: true,
            heldByTabId: true,
            heldSince: true,
            heldUntil: true,
          },
          where: { id: articleId },
        })

        // Still this tab's: another row was missing (an author, say), not the
        // hold, so the save failed.
        if (
          currentHold?.heldByAuthorId === tab.authorId &&
          currentHold.heldByTabId === tab.tabId
        ) {
          throw error
        }

        // The hold moved between the check and the write.
        return toNotHeld(currentHold)
      }

      await Promise.all(updatedImages.map(({ cleanup }) => cleanup()))

      const savedResult = {
        slugSuggestion,
        status: 'saved',
        updatedAt: saved.savedArticle.updatedAt,
      } as const

      const change =
        hasContent && saved.firstContent.count === 1 ? 'create' : 'update'

      // A save that leaves a draft empty stays out of its history (0020).
      if (!hasContent && storedArticle.firstContentAt === null) {
        return savedResult
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

      return savedResult
    },
    target: {
      authorIds: storedArticle.authors.map((author) => author.id),
      state,
    },
  })
}
