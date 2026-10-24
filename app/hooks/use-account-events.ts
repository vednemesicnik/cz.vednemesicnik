import type { AccountEvent } from '~/utils/sse/account-event'

import { type AdminEventsOptions, useAdminEvents } from './use-admin-events'

/**
 * Re-runs the page's loaders when a user or an author changes elsewhere; see
 * {@link useAdminEvents} for the debounce and the hidden tab.
 *
 * @param options - `filter` narrows which account events concern the page.
 */
export const useAccountEvents = (
  options?: AdminEventsOptions<AccountEvent>,
): void => useAdminEvents('account-change', options)
