import { z } from 'zod'

import {
  ACTIVITY_ACTIONS,
  type ActivityAction,
} from '~/config/editorial-board-activity-config'

import { activityAnsweredCookie } from './activity-answered-cookie.server'

const valueSchema = z.object({ action: z.enum(ACTIVITY_ACTIONS) })

/**
 * @param request - The request carrying the cookie.
 * @returns The answer this browser just gave, or `null` when there is no cookie or its
 *   value does not hold up.
 */
export const readActivityAnsweredCookie = async (
  request: Request,
): Promise<ActivityAction | null> => {
  const value = await activityAnsweredCookie.parse(
    request.headers.get('Cookie'),
  )
  const parsed = valueSchema.safeParse(value)

  return parsed.success ? parsed.data.action : null
}
