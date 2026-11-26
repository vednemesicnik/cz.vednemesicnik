import { getStepPath } from './_step'

// Free of server imports: the route component needs it too.
const INTENTS = ['send-code', 'verify-code'] as const

/** The signature step's two forms besides the submit (design 15k). */
export type Intent = (typeof INTENTS)[number]

/**
 * The intent travels in the address, not the body: the middleware has to tell
 * the submit from the code forms before it reads an 8 MB upload.
 *
 * @param url - The request's address.
 * @returns The intent, or `null` for the submit.
 */
export const parseIntent = (url: URL): Intent | null =>
  INTENTS.find((intent) => intent === url.searchParams.get('intent')) ?? null

/** @returns The address a code form posts to. */
export const getIntentPath = (intent: Intent): string =>
  `${getStepPath('signature')}?intent=${intent}`
