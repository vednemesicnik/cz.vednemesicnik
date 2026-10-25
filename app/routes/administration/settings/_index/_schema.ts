import { ColorScheme } from '@generated/prisma/enums'
import { z } from 'zod'

import { AUTHOR_CONFIG } from '~/config/author-config'
import { COLOR_SCHEME_CONFIG } from '~/config/color-scheme-config'

const { bioMaxLength, nameMaxLength, nameMinLength } = AUTHOR_CONFIG

export const BIO_MAX_LENGTH = bioMaxLength

export const profileSchema = z.object({
  bio: z
    .string()
    .max(bioMaxLength, {
      message: `Bio může mít maximálně ${bioMaxLength} znaků`,
    })
    .optional(),
  name: z
    .string({ message: 'Jméno je povinné' })
    .min(nameMinLength, {
      message: `Jméno musí mít alespoň ${nameMinLength} znaky`,
    })
    .max(nameMaxLength, {
      message: `Jméno může mít maximálně ${nameMaxLength} znaků`,
    }),
})

export const colorSchemeSchema = z.object({
  [COLOR_SCHEME_CONFIG.fieldName]: z.enum(ColorScheme),
})
