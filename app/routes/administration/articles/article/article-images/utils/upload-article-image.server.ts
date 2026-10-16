import { isCuid } from '@paralleldrive/cuid2'
import { data } from 'react-router'

import { ARTICLE_IMAGE_CONFIG } from '~/config/article-image-config'
import { buildArticlePageSeoImageWrites } from '~/routes/administration/articles/utils/build-article-page-seo-image-writes.server'
import { prisma } from '~/utils/db.server'
import { createImageSources } from '~/utils/image-store/create-image-sources'
import { isImageIdOwnedElsewhere } from '~/utils/image-store/is-image-id-owned-elsewhere.server'
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
 * Stores one picked image as soon as it is chosen (design 24b, decision
 * 0027). A new id becomes the gallery's last image; an id the article already
 * has gets the new file, and the old version's files go only after the row
 * commits, so a failed replacement keeps the old image. The row exists only
 * once the file is processed. An upload under way lands after *Zavřít*
 * released the hold, never over someone else's.
 *
 * @param request - The action's request.
 * @param options - The article, the tab, the image id, the file, and the alt
 *   text and caption typed while it was processed.
 * @returns `saved` with the stored preview's URL, `not-held`, or `failed`
 *   when the file could not be processed.
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
    landsWithoutHold: true,
    prepare: async (_context, article) => {
      const storedImage = await prisma.articleImage.findUnique({
        select: { articleId: true, version: true },
        where: { id: imageId },
      })

      // The store keys files by the id alone, so an id another record owns
      // is refused (decision 0022).
      if (
        storedImage === null
          ? await isImageIdOwnedElsewhere([imageId])
          : storedImage.articleId !== articleId
      ) {
        throw data(null, { status: 400 })
      }

      let meta: StoredImageMeta
      try {
        meta = await storeImageVariants(imageId, file)
      } catch {
        // A new image's files that made it to the store go with it; a
        // replaced one keeps its stored version.
        if (storedImage === null) await deleteImage(imageId)
        return { status: 'failed' }
      }

      const isFeatured = article.featuredImageId === imageId
      const seoWrites = isFeatured
        ? await buildArticlePageSeoImageWrites({
            featuredImage: { id: imageId, ...meta },
            slug: article.slug,
          })
        : []

      const answer = {
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

        return {
          addsContent: true,
          answer,
          onRefused: () => deleteImage(imageId),
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
            ...seoWrites,
          ],
        }
      }

      const previousVersion = storedImage.version

      return {
        answer,
        onCommitted: async () => {
          if (previousVersion !== meta.version) {
            await deleteImageVersion(imageId, previousVersion)
          }
        },
        onRefused: async () => {
          if (previousVersion !== meta.version) {
            await deleteImageVersion(imageId, meta.version)
          }
        },
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
