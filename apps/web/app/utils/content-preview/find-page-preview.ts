import type { PagePreview } from './page-preview'

type Match = { loaderData?: unknown }

const hasPreview = (
  loaderData: unknown,
): loaderData is { preview: PagePreview | null } =>
  typeof loaderData === 'object' &&
  loaderData !== null &&
  'preview' in loaderData

/**
 * The preview the deepest route on screen asks for (10d), so the layout can
 * draw the bar above the page that knows what it shows.
 *
 * @param matches - The route matches, outermost first (`useMatches()`).
 * @returns The deepest route's preview, or `null` when no route has one.
 */
export const findPagePreview = (matches: Match[]): PagePreview | null => {
  for (const match of [...matches].reverse()) {
    if (hasPreview(match.loaderData)) return match.loaderData.preview
  }

  return null
}
