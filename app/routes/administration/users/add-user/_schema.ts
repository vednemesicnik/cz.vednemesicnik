import { z } from 'zod'

import { organizationEmailField } from '~/utils/organization-email-field'

const baseSchema = z.object({
  email: organizationEmailField,
  name: z
    .string({ message: 'Jméno je povinné' })
    .min(3, { message: 'Jméno musí mít alespoň 3 znaky' })
    .max(30, { message: 'Jméno může mít maximálně 30 znaků' }),
  roleId: z.string({ message: 'Role je povinná' }),
})

export const schema = z.discriminatedUnion('authorMode', [
  baseSchema.extend({
    authorMode: z.literal('new'),
  }),
  baseSchema.extend({
    authorMode: z.literal('existing'),
    existingAuthorId: z.string({
      message: 'Vyberte existujícího autora',
    }),
  }),
])
