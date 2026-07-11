import type {
  AuthorPermissionAction,
  AuthorPermissionEntity,
  ContentState,
} from '@generated/prisma/enums'
import { redirect } from 'react-router'
import { requireSession } from '~/utils/auth.server'
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
  const { sessionId } = await requireSession(request)

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
      state?: ContentState
      targetAuthorIds?: string[]
    }) => {
      const targetAuthorIds = config.targetAuthorIds ?? [author.id]

      const { hasOwn, hasAny } = getAuthorRights(author.role.permissions, {
        action: config.action,
        entity: config.entity,
        ownId: author.id,
        state: config.state,
        targetAuthorIds,
      })

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
