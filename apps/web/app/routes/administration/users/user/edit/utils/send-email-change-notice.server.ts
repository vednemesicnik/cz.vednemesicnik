import { ALLOWED_EMAIL_DOMAIN } from '@constants/auth'

import { sendUsersNotice } from '~/utils/users-notice/send-users-notice.server'

/**
 * Tells the old address that the account's sign-in e-mail changed, naming the
 * new address and who changed it (design 28f). It goes out on every change;
 * like the sign-in link it is best-effort, so a failed delivery never undoes
 * the save.
 *
 * An old address off the organisation's domain (an account saved before the
 * domain check) gets nothing: the script sends only on the domain (log 0037),
 * so the refusal would only report an expected failure to Sentry.
 *
 * @param args.oldEmail - The address before the change, the recipient.
 * @param args.newEmail - The saved address, already lower-cased.
 * @param args.changedByName - The author name of whoever saved the change.
 * @returns Whether the notice went out; never throws.
 */
export const sendEmailChangeNotice = async ({
  oldEmail,
  newEmail,
  changedByName,
}: {
  oldEmail: string
  newEmail: string
  changedByName: string
}) => {
  if (!oldEmail.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
    console.info(
      '[email-change-notice] old address is off the domain — no notice sent.',
    )
    return false
  }

  return sendUsersNotice({
    changedByName,
    email: oldEmail,
    kind: 'email-change-notice',
    newEmail,
  })
}
