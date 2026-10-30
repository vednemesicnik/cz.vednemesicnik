import type { StatusTagState } from '~/components/status-tag'

/**
 * Whether the web shows content's publication date (10d): a draft's tag
 * stands in place of the date, an archived one's after it.
 *
 * @param previewState - From `getWebPreviewState`; `null` when published.
 * @returns `true` for published and archived content.
 */
export const showsPublishDate = (previewState: StatusTagState | null) =>
  previewState === null || previewState === 'archived'
