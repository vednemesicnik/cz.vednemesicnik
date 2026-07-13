import { recordAuditLog } from '~/utils/audit-log.server'
import { checkLastOwner } from '~/utils/check-last-owner.server'
import { prisma } from '~/utils/db.server'
import { withUserPermission } from '~/utils/permissions/user/actions/with-user-permission.server'

type Options = {
  id: string
  target: Parameters<typeof withUserPermission>[1]['target']
}

export const deleteUser = (request: Request, options: Options) =>
  withUserPermission(request, {
    action: 'delete',
    entity: 'user',
    execute: async (context) => {
      // Prevent deleting the last Owner in the system
      await checkLastOwner(options.id)

      await prisma.user.delete({ where: { id: options.id } })

      recordAuditLog({
        actorId: context.userId,
        event: 'user_deleted',
        request,
        targetId: options.id,
      })
    },
    target: options.target,
  })
