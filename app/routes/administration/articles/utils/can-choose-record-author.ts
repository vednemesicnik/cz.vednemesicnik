import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'

/**
 * Whether the role picks a record's authors freely: a category's or tag's
 * author (design 25c, iq3nur0e), and an article's without itself or as the
 * association (24j, decision 0026). Only the Coordinator does; a Creator or
 * Contributor is the author of what they create and stays one of an article's.
 *
 * @param roleLevel - The author role's level (lower is higher authority).
 */
export const canChooseRecordAuthor = (roleLevel: number) =>
  roleLevel <= APPROVER_ROLE_LEVEL
