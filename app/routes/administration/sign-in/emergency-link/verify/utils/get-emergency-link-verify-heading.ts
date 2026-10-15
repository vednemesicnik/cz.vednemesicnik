import type { Route } from '../+types/route'

type EmergencyLinkVerifyStatus = Route.ComponentProps['loaderData']['status']

/**
 * The heading of the opened emergency link's card (20f), which the tab title repeats (30a).
 *
 * @param status - The state the loader found the link in, or `invalid` after a failed confirm.
 * @returns The card heading.
 */
export const getEmergencyLinkVerifyHeading = (
  status: EmergencyLinkVerifyStatus,
): string => {
  switch (status) {
    case 'invalid':
    case 'invalid-signed-in':
      return 'Odkaz už neplatí'
    case 'same-account':
      return 'Už jste přihlášení'
    case 'other-account':
      return 'Odkaz je pro jiný účet'
    case 'valid':
      return 'Potvrďte přihlášení'
  }
}
