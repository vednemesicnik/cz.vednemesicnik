/**
 * What a link in the re-confirmation e-mails can ask for, by the names of the script's
 * contract, so a verified action posts as it is: stay, leave, or come back after a
 * removal without an answer (SCRIPT__Editorial_Board__Membership, `build-activity-token.gs`).
 */
export const ACTIVITY_ACTIONS = [
  'confirmActive',
  'leave',
  'reactivate',
] as const

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number]
