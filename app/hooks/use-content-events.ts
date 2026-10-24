import type { ContentEvent } from '~/utils/sse/content-event'

import { type AdminEventsOptions, useAdminEvents } from './use-admin-events'

/**
 * Re-runs the page's loaders when content changes elsewhere; see
 * {@link useAdminEvents} for the debounce and the hidden tab.
 *
 * @param options - `filter` narrows which content events concern the page;
 *   `onEvent` hears each of them at once, before the debounced revalidation;
 *   `revalidator` replaces the page's revalidation (the article list loads only
 *   the rows on screen, 22f).
 */
export const useContentEvents = (
  options?: AdminEventsOptions<ContentEvent>,
): void => useAdminEvents('content-change', options)
