import { ColorScheme } from '@generated/prisma/enums'
import { z } from 'zod'

import { AUTHOR_CONFIG } from '~/config/author-config'
import { COLOR_SCHEME_CONFIG } from '~/config/color-scheme-config'

export const BIO_MAX_LENGTH = AUTHOR_CONFIG.bioMaxLength

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

export const colorSchemeSchema = z.object({
  [COLOR_SCHEME_CONFIG.fieldName]: z.enum(ColorScheme),
})
