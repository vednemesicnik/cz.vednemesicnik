import { href } from 'react-router'

// Free of server imports: the route components need it too.
const STEP_PATHS = {
  details: href('/donate/request-confirmation'),
  sent: href('/donate/request-confirmation/sent'),
  verify: href('/donate/request-confirmation/verify'),
} as const

export type StepName = keyof typeof STEP_PATHS

/** @returns The step's address. */
export const getStepPath = (stepName: StepName): string => STEP_PATHS[stepName]
