import type { ContentState } from '@generated/prisma/enums'

export type HeaderAction =
  | 'approve'
  | 'approve-and-publish'
  | 'archive'
  | 'change-date'
  | 'delete'
  | 'edit'
  | 'publish'
  | 'restore'
  | 'retract'
  | 'return'
  | 'submit'
  | 'view-on-web'
  | 'withdraw'

type HeaderActions = {
  primary: HeaderAction | null
  outline: HeaderAction | null
  menu: HeaderAction[]
  sentence: string | null
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
}

const only = (action: HeaderAction, isAllowed: boolean) =>
  isAllowed ? [action] : []

const getDraftActions = (options: Options): HeaderActions => {
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
        options.submission === 'pending'
          ? 'Schválit může Koordinátor.'
          : 'Publikovat může Koordinátor.',
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

  // A draft nobody submitted is published from „⋯“, with the sentence beside (23d).
  if (options.canPublish) {
    return {
      menu: ['publish', ...only('delete', options.canDelete)],
      outline: edit[0] ?? null,
      primary: null,
      sentence: 'Článek nebyl odeslán ke schválení.',
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
    sentence: 'Upravovat mohou autoři článku a Koordinátor.',
  }
}

/**
 * The article header's actions by state and role (design 07c, 23b, 23d, 23e): at
 * most one primary and one outline action, the rest in „⋯“, and where the role
 * may do nothing, one sentence naming who can.
 *
 * @param options - The article's state and submission, whether it is submitted
 *   at all (no Coordinator among its authors), and what the signed-in author may
 *   do with it.
 * @returns The primary and outline action, the „⋯“ items in order (Smazat… last),
 *   and the sentence shown beside or instead of them.
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
        sentence: options.canRestore
          ? null
          : 'Obnovit článek může Koordinátor.',
      }
  }
}
