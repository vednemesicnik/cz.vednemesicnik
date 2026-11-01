import { href } from 'react-router'

// Free of server imports: the route component needs it too.
const STEP_NAMES = ['details', 'signature', 'sent'] as const

export type StepName = (typeof STEP_NAMES)[number]

/**
 * @param value - The address's `:stepName`.
 * @returns The step, or `null` when the address names none.
 */
export const parseStepName = (value: string | undefined): StepName | null =>
  STEP_NAMES.find((stepName) => stepName === value) ?? null

/** @returns The step's address. */
export const getStepPath = (stepName: StepName): string =>
  href('/organization/membership/application/:stepName?', { stepName })
