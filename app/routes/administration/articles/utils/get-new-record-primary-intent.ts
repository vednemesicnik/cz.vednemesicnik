import { FORM_CONFIG } from '~/config/form-config'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'

const INTENT_VALUE = FORM_CONFIG.intent.value

/**
 * The add page's primary action by role (design 07c, 25c): the Coordinator
 * publishes, a Creator or Contributor submits for review.
 *
 * @param roleLevel - The author role's level (lower is higher authority).
 */
export const getNewRecordPrimaryIntent = (roleLevel: number) =>
  roleLevel <= APPROVER_ROLE_LEVEL
    ? INTENT_VALUE.publish
    : INTENT_VALUE.submitForReview
