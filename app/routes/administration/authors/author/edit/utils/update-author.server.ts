import type { AuthorRoleName } from '@generated/prisma/enums'
import { data } from 'react-router'

import { prisma } from '~/utils/db.server'
import { throwDbError } from '~/utils/throw-db-error.server'

type Options = {
  authorId: string
  name: string
  bio?: string
  roleId: string
  loadedRoleId: string
}

type Result =
  | { status: 'saved' }
  | {
      status: 'role-changed'
      previousRoleName: AuthorRoleName
      roleName: AuthorRoleName
    }
  | {
      status: 'role-conflict'
      currentRoleId: string
      currentRoleName: AuthorRoleName
    }

/**
 * Saves Upravit autora (design 28c). Name and bio are written as sent; the
 * role only while the stored one is still the role the form was loaded with
 * (lj22mnbm, log 0041). The loaded role is a version, never a permission
 * target: the caller has checked the permission against the stored author.
 *
 * @param options.loadedRoleId - The role the form was loaded with.
 * @returns `saved` without a role change, `role-changed` with the roles for
 *   the audit log, or `role-conflict` with the stored role when it changed
 *   meanwhile, in which case name and bio are saved and the role is not.
 * @throws A 400 response for a role that does not exist.
 */
export const updateAuthor = async ({
  authorId,
  name,
  bio,
  roleId,
  loadedRoleId,
}: Options): Promise<Result> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      const stored = await transaction.author.findUniqueOrThrow({
        select: { role: { select: { id: true, name: true } } },
        where: { id: authorId },
      })

      await transaction.author.update({
        data: { bio: bio ?? null, name },
        where: { id: authorId },
      })

      if (stored.role.id !== loadedRoleId) {
        return {
          currentRoleId: stored.role.id,
          currentRoleName: stored.role.name,
          status: 'role-conflict',
        }
      }

      if (roleId === loadedRoleId) return { status: 'saved' }

      const role = await transaction.authorRole.findUnique({
        select: { name: true },
        where: { id: roleId },
      })

      if (role === null) {
        throw data(null, { status: 400 })
      }

      // Only while the role is still the loaded one.
      const { count } = await transaction.author.updateMany({
        data: { roleId },
        where: { id: authorId, roleId: loadedRoleId },
      })

      if (count === 0) {
        const current = await transaction.author.findUniqueOrThrow({
          select: { role: { select: { id: true, name: true } } },
          where: { id: authorId },
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
    return throwDbError(error, 'Unable to update the author.')
  }
}
