import type { Route } from '../+types/route'

type MagicLinkVerifyStatus = Route.ComponentProps['loaderData']['status']

/**
 * The heading of the opened magic link's card (20c), which the tab title repeats (30a).
 *
 * @param status - The state the loader found the link in.
 * @returns The card heading.
 */
export const getMagicLinkVerifyHeading = (
  status: MagicLinkVerifyStatus,
): string => {
  switch (status) {
    case 'other-account':
      return 'Odkaz je pro jiný účet'
    case 'invalid':
    case 'invalid-signed-in':
      return 'Odkaz už neplatí'
    case 'verify-identity':
      return 'Ověřte, že jste to vy'
    case 'valid':
      return 'Potvrďte přihlášení'
  }
}
