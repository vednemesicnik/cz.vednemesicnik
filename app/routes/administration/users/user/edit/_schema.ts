import { z } from 'zod'

import { organizationEmailField } from '~/utils/organization-email-field'

// No name and no password (design 28f): the name belongs to the author, and
// whoever forgets a password signs in with a link. The user role is one box,
// Člen or Administrátor, sent with the role the form was loaded with, so the
// save writes it only while it is still the stored one (lj22mnbm, log 0041).
// The Owner's form sends neither: the Owner's role never changes (log 0003).
export const schema = z.object({
  email: organizationEmailField,
  isAdministrator: z.boolean().default(false),
  loadedRoleId: z.string().optional(),
})
