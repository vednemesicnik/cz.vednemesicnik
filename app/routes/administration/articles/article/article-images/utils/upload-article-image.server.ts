import type { Prisma } from '@generated/prisma/client'
import { isCuid } from '@paralleldrive/cuid2'
import { data } from 'react-router'

import { ARTICLE_IMAGE_CONFIG } from '~/config/article-image-config'
import { buildArticlePageSeoImageWrites } from '~/routes/administration/articles/utils/build-article-page-seo-image-writes.server'
import { prisma } from '~/utils/db.server'
import { createImageSources } from '~/utils/image-store/create-image-sources'
import { isImageIdOwnedElsewhere } from '~/utils/image-store/is-image-id-owned-elsewhere.server'
import { isImageOverPixelBudget } from '~/utils/image-store/is-image-over-pixel-budget.server'
import {
  deleteImage,
  deleteImageVersion,
  type StoredImageMeta,
  storeImageVariants,
} from '~/utils/image-store/store-image.server'

import { saveArticleImageChange } from './save-article-image-change.server'

type Options = {
  articleId: string
  tabId: string
  /** Made in the editor, so a retried upload stores the image once (0022). */
  imageId: string
  file: File
  altText: string
  description: string
}

/**
 * Stores one picked image as soon as it is chosen (design 24b, log 0027).
 * A new id becomes the gallery's last image, and the main one when the
 * gallery was empty; an id the article already
 * has gets the new file, and the old version's files go only after the row
 * commits, so a failed replacement keeps the old image. The row exists only
 * once the file is processed. An upload under way lands after *Zavřít*
 * released the hold, never over someone else's. The editor can cancel it until
 * it saves: a cancel during the commit deletes a new image and puts a
 * replaced one back (bxy8xxqs).
 *
 * @param request - The action's request.
 * @param options - The article, the tab, the image id, the file, and the alt
 *   text and caption typed while it was processed.
 * @returns `saved` with the stored preview's URL and whether the image
 *   became the main one, `not-held`, `failed` when
 *   the file could not be processed (with the reason `over-pixel-budget` for
 *   an image over `MAX_IMAGE_PIXELS`, refused before it is stored), or
 *   `cancelled`.
 * @throws A 400 response for a file that is not an image or is too big, or an
 *   id that is not a cuid or belongs to another record.
 */
export async function uploadArticleImage(
  request: Request,
  { articleId, tabId, imageId, file, altText, description }: Options,
) {
  if (
    !isCuid(imageId) ||
    file.size === 0 ||
    file.size > ARTICLE_IMAGE_CONFIG.maxFileBytes ||
    !file.type.startsWith('image/')
  ) {
    throw data(null, { status: 400 })
  }

  return saveArticleImageChange(request, {
    articleId,
    isCancellable: true,
    landsWithoutHold: true,
    prepare: async (_context, article) => {
      const storedImage = await prisma.articleImage.findUnique({
        select: {
          articleId: true,
          fileName: true,
          intrinsicHeight: true,
          intrinsicWidth: true,
          placeholderDataUrl: true,
          version: true,
        },
        where: { id: imageId },
      })

      // The store keys files by the id alone, so an id another record owns
      // is refused (log 0022).
      if (
        storedImage === null
          ? await isImageIdOwnedElsewhere([imageId])
          : storedImage.articleId !== articleId
      ) {
        throw data(null, { status: 400 })
      }

      // Files this upload stored that no committed row uses. The row is
      // read again: another upload under the same id (a retry whose answer
      // was lost) may have committed meanwhile, and its files stay.
      const dropUnusedFiles = async (version: string | null) => {
        const committed = await prisma.articleImage.findUnique({
          select: { version: true },
          where: { id: imageId },
        })
        if (committed === null) {
          await deleteImage(imageId)
        } else if (version !== null && committed.version !== version) {
          await deleteImageVersion(imageId, version)
        }
      }

      if (await isImageOverPixelBudget(file)) {
        return { reason: 'over-pixel-budget', status: 'failed' }
      }

      let meta: StoredImageMeta
      try {
        meta = await storeImageVariants(imageId, file)
      } catch {
        // What made it to the store goes; a replaced image keeps its version.
        await dropUnusedFiles(null)
        return { status: 'failed' }
      }

      const isFeatured = article.featuredImageId === imageId
      const seoWrites = isFeatured
        ? await buildArticlePageSeoImageWrites({
            featuredImage: { id: imageId, ...meta },
            publishedSlug: article.publishedSlug,
          })
        : []

      const answer = {
        /** The upload made it the main image, which the editor then shows. */
        becameFeatured: false,
        fileName: file.name,
        previewUrl:
          createImageSources('article-image', { id: imageId, ...meta }).src ??
          null,
      }

      if (storedImage === null) {
        // After the gallery's last image (design 24b).
        const { _max: lastImage } = await prisma.articleImage.aggregate({
          _max: { position: true },
          where: { articleId },
        })

        // The first image of an empty gallery becomes the main one (log
        // 0053). The claim is checked in the commit itself, so of uploads
        // side by side only the first to commit gets it.
        const claimsFeatured =
          article.featuredImageId === null && lastImage.position === null
        const claimWrites = claimsFeatured
          ? [
              prisma.article.updateMany({
                data: { featuredImageId: imageId },
                where: {
                  featuredImageId: null,
                  id: articleId,
                  images: { every: { id: imageId } },
                },
              }),
            ]
          : []

        return {
          addsContent: true,
          answer,
          // Only the row and its files; a main image falls back to none with
          // the row.
          onCancelled: async () => {
            await prisma.articleImage.delete({
              select: { id: true },
              where: { id: imageId },
            })
            await deleteImage(imageId)
          },
          onRefused: () => dropUnusedFiles(meta.version),
          // The sharing preview follows only a claim that took: written in
          // the commit, another upload's preview could overwrite it. Publish
          // writes it again from the main image, so a failure only logs.
          onSettled: async (writeResults) => {
            const claim = writeResults[1] as Prisma.BatchPayload | undefined
            if (!claimsFeatured || claim?.count !== 1) return {}

            try {
              await prisma.$transaction(
                await buildArticlePageSeoImageWrites({
                  featuredImage: { id: imageId, ...meta },
                  publishedSlug: article.publishedSlug,
                }),
              )
            } catch (error) {
              console.error('Article sharing preview left unset', error)
            }
            return { becameFeatured: true }
          },
          writes: [
            prisma.articleImage.create({
              data: {
                ...meta,
                altText,
                articleId,
                description: description || null,
                fileName: file.name,
                id: imageId,
                position: (lastImage.position ?? -1) + 1,
              },
              select: { id: true },
            }),
            ...claimWrites,
            ...seoWrites,
          ],
        }
      }

      const previousMeta: StoredImageMeta = {
        intrinsicHeight: storedImage.intrinsicHeight,
        intrinsicWidth: storedImage.intrinsicWidth,
        placeholderDataUrl: storedImage.placeholderDataUrl,
        version: storedImage.version,
      }
      const previousVersion = previousMeta.version

      return {
        answer,
        // The previous version's files are still there: the row points back
        // at them, the sharing preview too, and the new version's go.
        onCancelled: async () => {
          const previousSeoWrites = isFeatured
            ? await buildArticlePageSeoImageWrites({
                featuredImage: { id: imageId, ...previousMeta },
                publishedSlug: article.publishedSlug,
              })
            : []
          await prisma.$transaction([
            prisma.articleImage.update({
              data: { ...previousMeta, fileName: storedImage.fileName },
              select: { id: true },
              where: { id: imageId },
            }),
            ...previousSeoWrites,
          ])
          if (previousVersion !== meta.version) {
            await deleteImageVersion(imageId, meta.version)
          }
        },
        onCommitted: async () => {
          if (previousVersion !== meta.version) {
            await deleteImageVersion(imageId, previousVersion)
          }
        },
        onRefused: () => dropUnusedFiles(meta.version),
        writes: [
          prisma.articleImage.update({
            data: { ...meta, fileName: file.name },
            select: { id: true },
            where: { id: imageId },
          }),
          ...seoWrites,
        ],
      }
    },
    tabId,
  })
}
