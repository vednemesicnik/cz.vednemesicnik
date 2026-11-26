import type { AuthorRoleName } from '@generated/prisma/enums'

/**
 * The warning under the role choice of Upravit autora (design 28c, copy
 * fzqkfmeg, 3vvfbk4i): what the new role allows or no longer allows. It
 * names no one, as the app does not know the author's grammatical gender.
 *
 * @param storedRole - The author's role as saved.
 * @param chosenRole - The role chosen in the form.
 * @returns The warning, or `null` for the same role and for Přispěvatel →
 *   Tvůrce, which takes nothing away and gives no publishing.
 */
export const getAuthorRoleChangeWarning = (
  storedRole: AuthorRoleName,
  chosenRole: AuthorRoleName,
): string | null => {
  if (storedRole === chosenRole) return null

  if (chosenRole === 'coordinator') {
    return 'Role Koordinátor umožňuje schvalovat a publikovat veškerý obsah.'
  }

  if (chosenRole === 'creator') {
    return storedRole === 'coordinator'
      ? 'Role Tvůrce neumožňuje schvalovat ani publikovat obsah.'
      : null
  }

  return storedRole === 'coordinator'
    ? 'Role Přispěvatel neumožňuje schvalovat ani publikovat obsah ani prohlížet cizí koncepty.'
    : 'Role Přispěvatel neumožňuje prohlížet cizí koncepty.'
}
