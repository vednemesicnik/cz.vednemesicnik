import { href } from 'react-router'

import { createMagicLinkUrl } from '~/utils/magic-link/create-magic-link-url'
import { createMagicLinkToken } from '~/utils/magic-link.server'
import { sendMagicLinkEmail } from '~/utils/send-magic-link-email.server'

/**
 * Sends the invitation of a new user (design 29e): the ordinary sign-in link,
 * landing in Settings, with the invitation text that names who sent it. Like
 * any sign-in link it is valid for 15 minutes and once; an expired one is
 * replaced from the sign-in page, never resent from here.
 *
 * @param args.email - The new account's address, already lower-cased.
 * @param args.inviterName - The inviting Administrator's author name.
 * @returns Whether the e-mail went out; never throws.
 */
export const sendInvitation = async ({
  email,
  inviterName,
}: {
  email: string
  inviterName: string
}) => {
  // The account already exists: a failed token write reads as an invitation
  // that did not go out, not as an error page.
  const token = await createMagicLinkToken(email).catch((error: unknown) => {
    console.error('[invitation] failed to issue the sign-in link —', error)
    return null
  })

  if (token === null) return false

  return sendMagicLinkEmail({
    email,
    inviterName,
    kind: 'invitation',
    link: createMagicLinkUrl({
      baseUrl: process.env.BASE_URL,
      email,
      redirectTo: href('/administration/settings'),
      token,
    }),
  })
}
