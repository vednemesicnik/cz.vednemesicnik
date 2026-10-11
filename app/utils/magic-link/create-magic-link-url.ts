import { withRedirectTo } from '~/utils/with-redirect-to'

/**
 * Builds the address a sign-in link e-mail carries: the confirmation page with
 * the token, the e-mail it was issued for and where to land after the confirm
 * click. Sign-in and the identity check (design 29d) send the same link.
 *
 * @param args.email - The e-mail the token was issued for.
 * @param args.token - The raw single-use token.
 * @param args.redirectTo - Where to land after confirming; sanitized.
 * @param args.baseUrl - The deployment's origin (`BASE_URL`).
 * @returns The absolute link.
 */
export const createMagicLinkUrl = ({
  email,
  token,
  redirectTo,
  baseUrl,
}: {
  email: string
  token: string
  redirectTo: string
  baseUrl: string | undefined
}) => {
  const link = new URL(
    withRedirectTo('/administration/sign-in/magic-link/verify', redirectTo),
    baseUrl,
  )
  link.searchParams.set('token', token)
  link.searchParams.set('email', email)

  return link.href
}
