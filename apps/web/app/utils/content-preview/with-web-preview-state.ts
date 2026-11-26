import { getWebPreviewState } from './get-web-preview-state'

type Content = Parameters<typeof getWebPreviewState>[0]

/**
 * Swaps the fields `WEB_PREVIEW_STATE_SELECT` loaded for the state tag they
 * resolve to, for a category or tag a public list shows (10d, 11e).
 *
 * @param content - A row selected with `WEB_PREVIEW_STATE_SELECT`.
 * @returns The row without `reviews`, `state` and `submittedAt`, with its `previewState`.
 */
export const withWebPreviewState = <Row extends Content>({
  reviews,
  state,
  submittedAt,
  ...rest
}: Row) => ({
  ...rest,
  previewState: getWebPreviewState({ reviews, state, submittedAt }),
})
