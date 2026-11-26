import type { ContentState } from '@generated/prisma/enums'

import type {
  ArticleAction,
  HeaderSentence,
} from '../../../utils/article-actions'

type HeaderActions = {
  primary: ArticleAction | null
  outline: ArticleAction | null
  menu: ArticleAction[]
  sentence: HeaderSentence | null
}

type Options = {
  state: ContentState
  submission: 'pending' | 'approved' | null
  isOwnContent: boolean
  isSubmittable: boolean
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
  /** Someone else holds the edit (07g); the flags are already masked. */
  isHeldByOther?: boolean
  canTakeOver?: boolean
}

const only = (action: ArticleAction, isAllowed: boolean) =>
  isAllowed ? [action] : []

const getDraftActions = (options: Options): HeaderActions => {
  // Someone else edits it: in place of the buttons, the page says who (23g),
  // and the Coordinator may take the edit over (24g).
  if (options.isHeldByOther === true) {
    return {
      menu: [],
      outline: options.canTakeOver === true ? 'take-over' : null,
      primary: null,
      sentence: null,
    }
  }

  const edit = only('edit', options.canEdit)

  if (options.submission !== null) {
    if (options.canPublish) {
      const isApproval = options.submission === 'pending' && options.canApprove

      return {
        menu: [...only('return', options.canReturn), ...edit],
        outline: isApproval ? 'approve' : null,
        primary: isApproval ? 'approve-and-publish' : 'publish',
        sentence: null,
      }
    }

    if (options.canWithdraw) {
      return { menu: [], outline: 'withdraw', primary: null, sentence: null }
    }

    return {
      menu: [],
      outline: null,
      primary: null,
      sentence:
        options.submission === 'pending' ? 'who-approves' : 'who-publishes',
    }
  }

  // A Coordinator among the authors means nobody submits it: published directly.
  if (options.canPublish && (options.isOwnContent || !options.isSubmittable)) {
    return {
      menu: only('delete', options.canDelete),
      outline: edit[0] ?? null,
      primary: 'publish',
      sentence: null,
    }
  }

  // A draft not submitted is published from „⋯“, with the sentence beside (23d).
  if (options.canPublish) {
    return {
      menu: ['publish', ...only('delete', options.canDelete)],
      outline: edit[0] ?? null,
      primary: null,
      sentence: 'not-submitted',
    }
  }

  if (options.canSubmit) {
    return {
      menu: only('delete', options.canDelete),
      outline: edit[0] ?? null,
      primary: 'submit',
      sentence: null,
    }
  }

  if (options.canEdit) {
    return {
      menu: only('delete', options.canDelete),
      outline: 'edit',
      primary: null,
      sentence: null,
    }
  }

  return {
    menu: only('delete', options.canDelete),
    outline: null,
    primary: null,
    sentence: 'who-edits',
  }
}

/**
 * The article header's actions by state and role (design 07c, 23b, 23d, 23e): at
 * most one primary and one outline action, the rest in „⋯“, and where the role
 * may do nothing, one sentence naming who can.
 *
 * @param options - The article's state and submission, whether it is submitted
 *   at all (no Coordinator among its authors), what the signed-in author may
 *   do with it, and whether someone else holds its edit (07g).
 * @returns The primary and outline action, the „⋯“ items in order (Smazat… last),
 *   and the sentence shown beside or instead of them. A draft someone else
 *   holds has only Převzít úpravu… for the Coordinator; the page says who
 *   edits it (23g).
 */
export const getHeaderActions = (options: Options): HeaderActions => {
  switch (options.state) {
    case 'draft':
      return getDraftActions(options)

    // No primary action on a published article (23e).
    case 'published':
      return {
        menu: [
          ...only('change-date', options.canChangePublishedAt),
          ...only('retract', options.canRetract),
          ...only('archive', options.canArchive),
        ],
        outline: 'view-on-web',
        primary: null,
        sentence: null,
      }

    case 'archived':
      return {
        menu: only('delete', options.canDelete),
        outline: options.canRestore ? 'restore' : null,
        primary: null,
        sentence: options.canRestore ? null : 'who-restores',
      }
  }
}
