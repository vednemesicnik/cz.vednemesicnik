export const DEFAULT_OG_IMAGE_PATH = '/images/og/default.jpg'

/**
 * Turns a page's share image into the absolute URL `og:image` requires.
 *
 * @param path - Root-relative image path from loader data, or `null`/`undefined`
 *   when the page has no image of its own.
 * @param baseUrl - The site origin (`ENV.BASE_URL`).
 * @returns The absolute image URL; the site's default share image when `path` is
 *   missing.
 */
export const resolveOgImageUrl = (
  path: string | null | undefined,
  baseUrl: string,
): string => {
  return new URL(path ?? DEFAULT_OG_IMAGE_PATH, baseUrl).href
}
