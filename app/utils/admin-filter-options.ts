import { AuthorRoleName } from '@generated/prisma/enums'

import { getAuthorRoleLabel } from '~/utils/role-labels'

// Taken from the Prisma enum so a role added to the schema cannot be missing
// from the filter. Declared by role level, most privileged first, which is the
// order the menu should read in.
const AUTHOR_ROLE_NAMES = Object.values(AuthorRoleName)

/**
 * Options for the Autorská role filter on the authors list (28a).
 */
export const AUTHOR_ROLE_OPTIONS = AUTHOR_ROLE_NAMES.map((roleName) => ({
  label: getAuthorRoleLabel(roleName),
  value: roleName,
}))

/**
 * Options for the Účet filter on the authors list: whether a user signs in as
 * the author (28a).
 */
export const ACCOUNT_OPTIONS = [
  { label: 'S účtem', value: 'linked' },
  { label: 'Bez účtu', value: 'none' },
]
