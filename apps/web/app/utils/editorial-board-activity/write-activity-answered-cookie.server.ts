import type { ActivityAction } from '~/config/editorial-board-activity-config'

import { activityAnsweredCookie } from './activity-answered-cookie.server'

/**
 * @param action - The answer just written.
 * @returns The `Set-Cookie` header value.
 */
export const writeActivityAnsweredCookie = (
  action: ActivityAction,
): Promise<string> => activityAnsweredCookie.serialize({ action })
