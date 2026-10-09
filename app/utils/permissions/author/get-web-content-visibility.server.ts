import type {
  AuthorPermissionEntity,
  ContentState,
} from '@generated/prisma/enums'

import { getAuthentication } from '~/utils/auth.server'

import { buildWebVisibleWhere } from './build-web-visible-where'
import { getAuthorPermissionContext } from './context/get-author-permission-context.server'

/**
 * Resolves what the public web may show to this request. Anonymous visitors
 * see published content; a signed-in author also previews the drafts they may
 * view in administration, never more.
 *
 * @param request - The incoming request.
 * @param entities - Every entity the loader will filter.
 * @returns `where(entity, ownFilter, previewStates)` building the clause for one entity; `previewStates` defaults to drafts.
 */
export const getWebContentVisibility = async (
  request: Request,
  entities: AuthorPermissionEntity[],
) => {
  const { isAuthenticated } = await getAuthentication(request)

  const context = isAuthenticated
    ? await getAuthorPermissionContext(request, { actions: ['view'], entities })
    : null

  return {
    where: <OwnFilter extends Record<string, unknown>>(
      entity: AuthorPermissionEntity,
      ownFilter: (authorId: string) => OwnFilter,
      previewStates: ContentState[] = ['draft'],
    ) =>
      buildWebVisibleWhere(
        context === null
          ? null
          : {
              ownFilter: ownFilter(context.authorId),
              stateRights: previewStates.map((state) => ({
                rights: context.can({ action: 'view', entity, state }),
                state,
              })),
            },
      ),
  }
}

/** What {@link getWebContentVisibility} resolves to, for helpers that take it. */
export type WebContentVisibility = Awaited<
  ReturnType<typeof getWebContentVisibility>
>

/** "Mine" predicate for articles, which have many authors. */
export const ownArticle = (authorId: string) => ({
  authors: { some: { id: authorId } },
})

/** "Mine" predicate for content with a single creating author. */
export const ownByAuthor = (authorId: string) => ({ authorId })
