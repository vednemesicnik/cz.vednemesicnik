import type { LoaderFunctionArgs } from 'react-router'

import { prisma } from '~/utils/db.server'
import { createFormattedDate } from '~/utils/format-date'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const context = await getUserPermissionContext(request, {
    actions: ['update'],
    entities: ['user'],
  })

  const canUpdate = context.can({
    action: 'update',
    entity: 'user',
    targetUserId: context.userId,
  }).hasPermission

  if (!canUpdate) {
    throw new Response('Forbidden', { status: 403 })
  }

  const passkeys = await prisma.passkey.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      createdAt: true,
      credentialDeviceType: true,
      id: true,
    },
    where: { userId: context.userId },
  })

  return {
    passkeys: passkeys.map((passkey) => ({
      createdAt: createFormattedDate(passkey.createdAt),
      deviceType: passkey.credentialDeviceType,
      id: passkey.id,
    })),
    userId: context.userId,
  }
}
