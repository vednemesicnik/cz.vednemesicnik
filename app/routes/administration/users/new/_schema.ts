import { z } from 'zod'

import { organizationEmailField } from '~/utils/organization-email-field'
import { authorRecordSchema } from '../../authors/utils/author-record-schema'
import { USER_RECORD_COPY } from '../user-record-copy'

// The account itself: its e-mail and whether it manages users and authors.
// The user role is never sent: the box chooses between Člen and
// Administrátor (design 28f).
const accountFields = {
  email: organizationEmailField,
  isAdministrator: z.boolean().default(false),
}

/**
 * Nový uživatel (design 28f): the author first, a new one with its name and
 * author role (the fields of Nový autor, 28c) or an existing one without an
 * account, whose name and role it keeps.
 */
export const schema = z.discriminatedUnion('authorMode', [
  z.object({
    ...accountFields,
    authorMode: z.literal('new'),
    authorRoleId: z.string(),
    name: authorRecordSchema.shape.name,
  }),
  z.object({
    ...accountFields,
    authorMode: z.literal('existing'),
    existingAuthorId: z.string({
      message: USER_RECORD_COPY.author.existingRequired,
    }),
  }),
])
