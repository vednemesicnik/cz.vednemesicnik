import { z } from 'zod'

import { AUTHOR_CONFIG } from '~/config/author-config'

const { bioMaxLength, nameMaxLength, nameMinLength } = AUTHOR_CONFIG

/**
 * An author's fields on Nový autor and Upravit autora, with the errors at
 * the fields (design 28c, copy fzqkfmeg).
 */
export const authorRecordSchema = z.object({
  bio: z
    .string()
    .max(bioMaxLength, {
      message: `Zkraťte bio na nejvýše ${bioMaxLength} znaků.`,
    })
    .optional(),
  name: z
    .string({ message: 'Doplňte jméno.' })
    .min(nameMinLength, {
      message: `Zadejte jméno alespoň o ${nameMinLength} znacích.`,
    })
    .max(nameMaxLength, {
      message: `Zkraťte jméno na nejvýše ${nameMaxLength} znaků.`,
    }),
  roleId: z.string(),
})

/**
 * Upravit autora also sends the role the form was loaded with: the save
 * writes the role only while it is still the stored one (lj22mnbm, log 0041).
 */
export const editAuthorRecordSchema = authorRecordSchema.extend({
  loadedRoleId: z.string(),
})
