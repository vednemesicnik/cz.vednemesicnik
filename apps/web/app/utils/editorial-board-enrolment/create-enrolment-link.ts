import { href } from 'react-router'

/**
 * Builds the address the confirmation e-mail carries. Only the token: the row is found
 * by its hash, so the address stays out of the link (log 0065).
 *
 * @param args.baseUrl - The deployment's origin (`BASE_URL`).
 * @param args.token - The raw token.
 * @returns The absolute link.
 */
export const createEnrolmentLink = ({
  baseUrl,
  token,
}: {
  baseUrl: string | undefined
  token: string
}) => {
  const link = new URL(href('/editorial-board/enrolment/confirm'), baseUrl)
  link.searchParams.set('token', token)

  return link.href
}
