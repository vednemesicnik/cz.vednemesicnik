import { z } from 'zod'

export const FEATURED_IMAGE_SOURCE = {
  EXISTING: 'existing',
  NEW: 'new',
  NONE: 'none',
} as const

export type FeaturedImageSource =
  (typeof FEATURED_IMAGE_SOURCE)[keyof typeof FEATURED_IMAGE_SOURCE]

export const featuredImageSchema = z
  .string()
  .default(FEATURED_IMAGE_SOURCE.NONE)
  .transform((value) => {
    const [source, param] = value.split(':', 2)

    switch (source) {
      case FEATURED_IMAGE_SOURCE.NEW: {
        const index = parseInt(param, 10)
        if (Number.isNaN(index)) {
          throw new Error('Invalid index for new image')
        }
        return { index, source: FEATURED_IMAGE_SOURCE.NEW }
      }

      case FEATURED_IMAGE_SOURCE.EXISTING: {
        if (!param) {
          throw new Error('Missing id for existing image')
        }
        return { id: param, source: FEATURED_IMAGE_SOURCE.EXISTING }
      }

      case FEATURED_IMAGE_SOURCE.NONE:
      case '':
      default:
        return { source: FEATURED_IMAGE_SOURCE.NONE }
    }
  })

export type FeaturedImage = z.infer<typeof featuredImageSchema>
