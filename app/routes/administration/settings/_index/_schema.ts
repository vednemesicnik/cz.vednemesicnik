import { z } from 'zod'

// Largest profile photo accepted (design 29b: „Nejvýš 5 MB“).
export const MAX_PROFILE_IMAGE_SIZE = 1024 * 1024 * 5

export const BIO_MAX_LENGTH = 500

export const profileSchema = z.object({
  bio: z
    .string()
    .max(BIO_MAX_LENGTH, { message: 'Bio může mít maximálně 500 znaků' })
    .optional(),
  name: z
    .string({ message: 'Jméno je povinné' })
    .min(2, { message: 'Jméno musí mít alespoň 2 znaky' })
    .max(100, { message: 'Jméno může mít maximálně 100 znaků' }),
})

export const imageSchema = z.object({
  image: z
    .instanceof(File, {
      message: 'Vyberte obrázek — tento soubor není obrázek.',
    })
    .refine((file) => file.type.startsWith('image/'), {
      message: 'Vyberte obrázek — tento soubor není obrázek.',
    })
    .refine((file) => file.size <= MAX_PROFILE_IMAGE_SIZE, {
      message: 'Vyberte obrázek do 5 MB — tento je příliš velký.',
    }),
})
