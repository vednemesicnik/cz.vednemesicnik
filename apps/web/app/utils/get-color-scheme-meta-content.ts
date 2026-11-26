import type { ColorScheme } from '@generated/prisma/enums'

/**
 * Maps the account's colour scheme to the content of
 * `<meta name="color-scheme">`, which `global.css` mirrors into the
 * `color-scheme` property.
 *
 * @param colorScheme - The scheme chosen in Settings (design 29a).
 * @returns `light dark` to follow the device, or the one scheme pinned.
 */
export const getColorSchemeMetaContent = (colorScheme: ColorScheme) => {
  if (colorScheme === 'system') {
    return 'light dark'
  }

  return colorScheme
}
