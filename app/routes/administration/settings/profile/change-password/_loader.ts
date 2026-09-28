import type { LoaderFunctionArgs } from 'react-router'

import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { requireRecentAuthentication } from '~/utils/recent-authentication.server'

export const loader = async ({ request, url }: LoaderFunctionArgs) => {
  await requireRecentAuthentication({ request, url })

  const context = await getUserPermissionContext(request, {
    actions: ['update'],
    entities: ['user'],
  })

  // Check if user can update their own profile
  const canUpdate = context.can({
    action: 'update',
    entity: 'user',
    targetUserId: context.userId,
  }).hasPermission

  if (!canUpdate) {
    throw new Response('Forbidden', { status: 403 })
  }

  return { userId: context.userId }
}
