import type {
  AuthorPermissionAccess,
  AuthorPermissionAction,
  AuthorPermissionEntity,
  ContentState,
} from '@generated/prisma/enums'
import { redirect } from 'react-router'
import { requireAuthentication } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import { getAuthorRights } from '~/utils/permissions/core/get-author-rights'

type GetAuthorPermissionContextOptions = {
  entities: AuthorPermissionEntity[]
  actions: AuthorPermissionAction[]
}

export async function getAuthorPermissionContext(
  request: Request,
  options: GetAuthorPermissionContextOptions,
) {
  const { sessionId } = await requireAuthentication(request)

  const session = await prisma.session.findUniqueOrThrow({
    select: {
      user: {
        select: {
          author: {
            select: {
              id: true,
              role: {
                select: {
                  level: true,
                  name: true,
                  permissions: {
                    select: {
                      access: true,
                      action: true,
                      entity: true,
                      state: true,
                    },
                    where: {
                      action: { in: options.actions },
                      entity: { in: options.entities },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    where: { id: sessionId },
  })

  const author = session.user.author

  if (!author) {
    // Redirect users without author records to the admin dashboard
    // They may have system permissions but not content permissions
    throw redirect('/administration')
  }

  if (!author.role) {
    throw new Error(
      'Author does not have an associated role. Cannot determine permissions.',
    )
  }

  return {
    authorId: author.id,

    can: (config: {
      entity: AuthorPermissionEntity
      action: AuthorPermissionAction
      access?: AuthorPermissionAccess[]
      state?: ContentState
      targetAuthorId?: string
    }) => {
      const access = config.access ?? ['own', 'any']
      const states = config.state ? [config.state] : ['*']
      const targetAuthorId = config.targetAuthorId ?? author.id

      const result = getAuthorRights(author.role.permissions, {
        access,
        actions: [config.action],
        entities: [config.entity],
        ownId: author.id,
        states,
        targetId: targetAuthorId,
      })

      // Result structure: [entity][action][access][state]
      // [0] = first entity (we only pass 1)
      // [0][0] = first action (we only pass 1)
      // [0][0][0] = "own" access (first in access array)
      // [0][0][1] = "any" access (second in access array)
      // [0][0][0][0] = first state for "own" (we only pass 1)
      // [0][0][1][0] = first state for "any" (we only pass 1)
      const hasOwn = result[0][0][0][0]
      const hasAny = result[0][0][1][0]

      return {
        hasAny,
        hasOwn,
        hasPermission: hasOwn || hasAny,
      }
    },
    permissions: author.role.permissions,
    roleLevel: author.role.level,
    roleName: author.role.name,
  }
}

export type AuthorPermissionContext = Awaited<
  ReturnType<typeof getAuthorPermissionContext>
>
