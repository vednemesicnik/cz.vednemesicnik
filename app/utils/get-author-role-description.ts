import type { AuthorRoleName } from '@generated/prisma/enums'

// What each role allows, in one sentence: a summary of 07c (design 28c).
const descriptions: Record<AuthorRoleName, string> = {
  contributor: 'Píše vlastní koncepty a odesílá je ke schválení.',
  coordinator: 'Schvaluje a publikuje obsah celé redakce.',
  creator:
    'Píše vlastní koncepty, odesílá je ke schválení a vidí i cizí koncepty.',
}

/**
 * The sentence under an author role where the role is chosen (design 28c, 28f).
 *
 * @param roleName - The author role.
 * @returns What the role allows.
 */
export const getAuthorRoleDescription = (roleName: AuthorRoleName): string =>
  descriptions[roleName]
