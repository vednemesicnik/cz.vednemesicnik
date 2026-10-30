import type {
  AuthorPermissionEntity,
  ContentState,
} from '@generated/prisma/enums'

import { getPreviewMode } from '~/utils/reader-view/get-preview-mode.server'

import { buildWebVisibleWhere } from './build-web-visible-where'
import { getAuthorPermissionContext } from './context/get-author-permission-context.server'

/**
 * Resolves what the public web may show to this request. Anonymous visitors
 * see published content; a signed-in author also previews the drafts they may
 * view in administration, never more, unless they chose to view the web as a
 * reader (10d).
 *
 * @param request - The incoming request.
 * @param entities - Every entity the loader will filter.
 * @param options.ignoreReaderView - Answer what the author could preview even
 *   in the reader view, for the administration's link to the web (tly4a163).
 * @returns `previewMode` (`staff` previews, `reader` chose the reader view, `null` signed out) and `where(entity, ownFilter, previewStates)` building the clause for one entity; `previewStates` defaults to drafts.
 */
export const getWebContentVisibility = async (
  request: Request,
  entities: AuthorPermissionEntity[],
  { ignoreReaderView = false }: { ignoreReaderView?: boolean } = {},
) => {
  const previewMode = await getPreviewMode(request)
  const isPreviewing =
    previewMode === 'staff' || (ignoreReaderView && previewMode === 'reader')

  const context = isPreviewing
    ? await getAuthorPermissionContext(request, {
        actions: ['view'],
        entities,
      })
    : null

  return {
    previewMode,
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
