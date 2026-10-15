import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'

/**
 * Whether the role picks a category's or tag's author (design 25c, iq3nur0e).
 * Only the Coordinator does; for a Creator or Contributor the author is
 * whoever creates the record.
 *
 * @param roleLevel - The author role's level (lower is higher authority).
 */
export const canChooseRecordAuthor = (roleLevel: number) =>
  roleLevel <= APPROVER_ROLE_LEVEL
