import type { ContentState } from '@generated/prisma/enums'

import type { ArticleAction } from './article-actions'

type RowActions = {
  row: ArticleAction | null
  menu: ArticleAction[]
}

type Options = {
  state: ContentState
  submission: 'pending' | 'approved' | null
  canEdit: boolean
  canSubmit: boolean
  canWithdraw: boolean
  canReturn: boolean
  canApprove: boolean
  canPublish: boolean
  canRetract: boolean
  canArchive: boolean
  canRestore: boolean
  canDelete: boolean
  canChangePublishedAt: boolean
}

const only = (action: ArticleAction, isAllowed: boolean) =>
  isAllowed ? [action] : []

/**
 * A list row's actions by state and role (design 22a, 22b, 07c): the one action
 * people come to the row for, and the rest in „⋯“. What the role may not do is
 * left out.
 *
 * @param options - The article's state and submission, and what the signed-in
 *   author may do with it.
 * @returns The row action — Upravit on a draft, Schválit on a waiting one,
 *   Publikovat… on an approved one, none on a published or archived one — and
 *   the „⋯“ items in the 07c order, Smazat… last.
 */
export const getRowActions = (options: Options): RowActions => {
  switch (options.state) {
    case 'draft': {
      const submissionMenu = [
        ...only('return', options.canReturn),
        ...only('edit', options.canEdit),
        ...only('withdraw', options.canWithdraw),
      ]

      if (options.submission === 'pending') {
        return {
          menu: [
            ...only(
              'approve-and-publish',
              options.canApprove && options.canPublish,
            ),
            ...submissionMenu,
          ],
          row: options.canApprove
            ? 'approve'
            : options.canPublish
              ? 'publish'
              : null,
        }
      }

      if (options.submission === 'approved') {
        return {
          menu: submissionMenu,
          row: options.canPublish ? 'publish' : null,
        }
      }

      // Odeslat ke schválení is first in „⋯“; people come to a draft to write (22b).
      return {
        menu: [
          ...only('submit', options.canSubmit),
          ...only('publish', options.canPublish),
          ...only('delete', options.canDelete),
        ],
        row: options.canEdit ? 'edit' : null,
      }
    }

    case 'published':
      return {
        menu: [
          'view-on-web',
          ...only('change-date', options.canChangePublishedAt),
          ...only('retract', options.canRetract),
          ...only('archive', options.canArchive),
        ],
        row: null,
      }

    case 'archived':
      return {
        menu: [
          ...only('restore', options.canRestore),
          ...only('delete', options.canDelete),
        ],
        row: null,
      }
  }
}
