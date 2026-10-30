import type { StatusTagState } from '~/components/status-tag'

import type { PagePreview } from './page-preview'

/**
 * The preview a list page asks the layout for (10d): the bar when any item is
 * unpublished, nothing otherwise.
 *
 * @param items - The page's items, each with its `previewState`.
 * @returns `{ kind: 'list' }` or `null`.
 */
export const getListPreview = (
  items: { previewState: StatusTagState | null }[],
): PagePreview | null =>
  items.some((item) => item.previewState !== null) ? { kind: 'list' } : null
