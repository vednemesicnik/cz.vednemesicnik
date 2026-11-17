import { getStepPath } from '../_step'

// Free of server imports: the route component needs it too.
const INTENTS = ['send-code', 'submit', 'verify-code'] as const

/** The verify step's three forms. */
export type Intent = (typeof INTENTS)[number]

/**
 * The intent travels in the address, so the middleware can count the code
 * tries before it reads a body.
 *
 * @param url - The request's address.
 * @returns The intent, or `null` when the address names none.
 */
export const parseIntent = (url: URL): Intent | null =>
  INTENTS.find((intent) => intent === url.searchParams.get('intent')) ?? null

/** @returns The address a form of the step posts to. */
export const getIntentPath = (intent: Intent): string =>
  `${getStepPath('verify')}?intent=${intent}`
