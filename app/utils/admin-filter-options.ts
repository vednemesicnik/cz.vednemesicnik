import { AuthorRoleName, UserRoleName } from '@generated/prisma/enums'

import { contentStateConfig } from '~/config/content-state-config'
import { getAuthorRoleLabel, getUserRoleLabel } from '~/utils/role-labels'

// Taken from the Prisma enums so a role added to the schema cannot be missing
// from the filter. Both are declared by role level, most privileged first, which
// is the order the select should read in.
const USER_ROLE_NAMES = Object.values(UserRoleName)
const AUTHOR_ROLE_NAMES = Object.values(AuthorRoleName)

/**
 * Options for the content-state filter select, shared by every admin list whose
 * rows carry a `ContentState`.
 */
export const CONTENT_STATE_OPTIONS = contentStateConfig.states.map((state) => ({
  label: contentStateConfig.selectMap[state],
  value: state,
}))

/**
 * Options for the user-role filter select on the users list.
 */
export const USER_ROLE_OPTIONS = USER_ROLE_NAMES.map((roleName) => ({
  label: getUserRoleLabel(roleName),
  value: roleName,
}))

/**
 * Options for the author-role filter select on the authors list.
 */
export const AUTHOR_ROLE_OPTIONS = AUTHOR_ROLE_NAMES.map((roleName) => ({
  label: getAuthorRoleLabel(roleName),
  value: roleName,
}))
