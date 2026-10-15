import type { ContentActionFlags } from '~/utils/permissions/author/get-content-action-flags.server'

type Options = {
  isHeldByOther: boolean
  isApprover: boolean
}

/**
 * Takes away what waits while someone else edits the article (design 07g): the
 * edit and every action that changes its state. Reading, the web preview and
 * the selection stay. The Coordinator may take the edit over instead (24g).
 *
 * @param flags - What the role may do, from `getContentActionFlags`.
 * @param options - Whether someone else holds the article, and whether the
 *   signed-in author is the Coordinator.
 * @returns The same flags, masked while held, and `canTakeOver`.
 */
export const getHeldActionFlags = <Flags extends ContentActionFlags>(
  flags: Flags,
  { isHeldByOther, isApprover }: Options,
) =>
  isHeldByOther
    ? {
        ...flags,
        canApprove: false,
        canDelete: false,
        canEdit: false,
        canPublish: false,
        canReturn: false,
        canSubmit: false,
        canTakeOver: isApprover && flags.canEdit,
        canWithdraw: false,
      }
    : { ...flags, canTakeOver: false }
