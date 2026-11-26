import { z } from 'zod'

// Largest profile photo accepted (design 29b: „Nejvýš 5 MB“).
export const MAX_PROFILE_IMAGE_SIZE = 1024 * 1024 * 5

export const NOT_AN_IMAGE_MESSAGE =
  'Vyberte obrázek — tento soubor není obrázek.'

export const IMAGE_TOO_LARGE_MESSAGE =
  'Vyberte obrázek do 5 MB — tento je příliš velký.'

export const FAILED_MESSAGE =
  'Zkuste obrázek nahrát znovu — nahrání se nezdařilo.'

/** One change of the profile photo, saved on its own (design 29b). */
export const schema = z.discriminatedUnion('intent', [
  z.object({
    image: z
      .instanceof(File, { message: NOT_AN_IMAGE_MESSAGE })
      .refine((file) => file.size > 0 && file.type.startsWith('image/'), {
        message: NOT_AN_IMAGE_MESSAGE,
      })
      .refine((file) => file.size <= MAX_PROFILE_IMAGE_SIZE, {
        message: IMAGE_TOO_LARGE_MESSAGE,
      }),
    intent: z.literal('upload'),
  }),
  z.object({ intent: z.literal('remove') }),
])
