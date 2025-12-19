import type { AuthorRoleName, UserRoleName } from "@generated/prisma/enums"

/**
 * User role labels (system access roles)
 * In the future, these could be replaced with i18n translation keys
 */
const userRoleLabels: Record<UserRoleName, string> = {
  owner: "Vlastník",
  administrator: "Administrátor",
  member: "Člen",
}

/**
 * Author role labels (content management roles)
 * In the future, these could be replaced with i18n translation keys
 */
const authorRoleLabels: Record<AuthorRoleName, string> = {
  coordinator: "Koordinátor",
  creator: "Tvůrce",
  contributor: "Přispěvatel",
}

/**
 * Get the Czech label for a user role name.
 *
 * @param roleName - The role name (e.g., "owner", "administrator", "member")
 * @returns The Czech label for the role
 */
export function getUserRoleLabel(roleName: UserRoleName): string {
  return userRoleLabels[roleName]
}

/**
 * Get the Czech label for an author role name.
 *
 * @param roleName - The role name (e.g., "coordinator", "creator", "contributor")
 * @returns The Czech label for the role
 */
export function getAuthorRoleLabel(roleName: AuthorRoleName): string {
  return authorRoleLabels[roleName]
}
