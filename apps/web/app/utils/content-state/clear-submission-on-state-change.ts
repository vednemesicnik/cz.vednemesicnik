import type { StateTransitionData } from './create-content-state-handlers.server'

/**
 * Ends the submission with any change of state (design 07b, 07e): a retracted or
 * restored draft is unsubmitted, a published or archived item waits no more. A
 * transition that only moves the publish date keeps it.
 *
 * Apply it to the entity row's own `update` only, like `clearReviewsOnDraft`.
 *
 * @param data - The transition's columns.
 * @returns The same columns, with the submission cleared when the state changes.
 */
export const clearSubmissionOnStateChange = <Data extends StateTransitionData>(
  data: Data,
) =>
  data.state === undefined
    ? data
    : { ...data, submittedAt: null, submittedById: null }
