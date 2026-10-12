import { APPROVER_ROLE_LEVEL } from '../review-policy'

type Options = {
  submittedAt: Date | null
  roleLevel: number
}

/**
 * Whether a submitted article is locked for the signed-in author (design 07d): it
 * waits for the Coordinator, so its authors take it back before editing. The
 * Coordinator may still correct it, and the approval stays.
 *
 * @param options.submittedAt - When it was submitted, or null.
 * @param options.roleLevel - The signed-in author's role level.
 * @returns True when editing is locked for this author.
 */
export const isLockedBySubmission = ({
  submittedAt,
  roleLevel,
}: Options): boolean => submittedAt !== null && roleLevel > APPROVER_ROLE_LEVEL
