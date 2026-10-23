import type { UserRoleName } from '@generated/prisma/enums'

import { prisma } from '~/utils/db.server'
import { throwDbError } from '~/utils/throw-db-error.server'

type Role = {
  id: string
  name: UserRoleName
  loadedRoleId: string
}

type Options = {
  userId: string
  email: string
  role: Role | null
}

type Result =
  | { status: 'saved' }
  | {
      status: 'role-changed'
      previousRoleName: UserRoleName
      roleName: UserRoleName
    }
  | {
      status: 'role-conflict'
      currentRoleId: string
      currentRoleName: UserRoleName
    }

/**
 * Saves Upravit uživatele (design 28f). The e-mail is written as sent, the
 * later save wins; the user role only while the stored one is still the role
 * the form was loaded with (lj22mnbm, log 0041). The loaded role is a version,
 * never a permission target: the caller has checked the permission against
 * the stored account and the requested role.
 *
 * @param options.role - The requested role with the one the form was loaded
 *   with, or `null` when the form sends none (the Owner's).
 * @returns `saved` without a role change, `role-changed` with the roles for
 *   the audit log, or `role-conflict` with the stored role when it changed
 *   meanwhile, in which case the e-mail is saved and the role is not.
 */
export const updateUser = async ({
  userId,
  email,
  role,
}: Options): Promise<Result> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      const stored = await transaction.user.findUniqueOrThrow({
        select: { role: { select: { id: true, name: true } } },
        where: { id: userId },
      })

      await transaction.user.update({
        data: { email, username: email },
        where: { id: userId },
      })

      if (role === null) return { status: 'saved' }

      if (stored.role.id !== role.loadedRoleId) {
        return {
          currentRoleId: stored.role.id,
          currentRoleName: stored.role.name,
          status: 'role-conflict',
        }
      }

      if (role.id === role.loadedRoleId) return { status: 'saved' }

      // Only while the role is still the loaded one.
      const { count } = await transaction.user.updateMany({
        data: { roleId: role.id },
        where: { id: userId, roleId: role.loadedRoleId },
      })

      if (count === 0) {
        const current = await transaction.user.findUniqueOrThrow({
          select: { role: { select: { id: true, name: true } } },
          where: { id: userId },
        })

        return {
          currentRoleId: current.role.id,
          currentRoleName: current.role.name,
          status: 'role-conflict',
        }
      }

      return {
        previousRoleName: stored.role.name,
        roleName: role.name,
        status: 'role-changed',
      }
    })
  } catch (error) {
    return throwDbError(error, 'Unable to update the user.')
  }
}
