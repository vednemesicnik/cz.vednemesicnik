import { z } from 'zod'

import { organizationEmailField } from '~/utils/organization-email-field'

// No name and no password (design 28f): the name belongs to the author, and
// whoever forgets a password signs in with a link.
export const schema = z.object({
  email: organizationEmailField,
  roleId: z.string({ message: 'Role je povinná' }),
  userId: z.string().readonly(),
})
