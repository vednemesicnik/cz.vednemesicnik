/**
 * Builds the emergency sign-in link (design 20f): the confirmation page with
 * the token. The address carries no e-mail; the token names the account.
 *
 * @param args.token - The raw single-use token.
 * @param args.baseUrl - The deployment's origin (`BASE_URL`).
 * @returns The absolute link.
 */
export const createEmergencySignInLinkUrl = ({
  token,
  baseUrl,
}: {
  token: string
  baseUrl: string | undefined
}) => {
  const link = new URL('/administration/sign-in/emergency-link/verify', baseUrl)
  link.searchParams.set('token', token)

  return link.href
}
