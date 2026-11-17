import {
  DONATION_VERIFICATION_SENDS_PER_ADDRESS,
  DONATION_VERIFICATION_SENDS_PER_IP,
} from '~/config/donation-request-config'
import {
  type IssueVerificationCodeResult,
  issueVerificationCode,
} from '~/utils/email-verification/issue-verification-code.server'

import { sendDonationVerificationCodeEmail } from './send-donation-verification-code-email.server'

/**
 * Makes the code that confirms the donor's address and has the donation script
 * mail it.
 *
 * @param email - The address, normalised by the caller (lower case).
 * @param request - The request, for the client's IP.
 * @returns See `issueVerificationCode`. Never throws.
 */
export const issueDonationVerificationCode = (
  email: string,
  request: Request,
): Promise<IssueVerificationCodeResult> =>
  issueVerificationCode({
    email,
    limits: {
      sendsPerAddress: DONATION_VERIFICATION_SENDS_PER_ADDRESS,
      sendsPerIp: DONATION_VERIFICATION_SENDS_PER_IP,
    },
    purpose: 'donation-verify',
    request,
    secret: process.env.DONATION_VERIFICATION_SECRET ?? '',
    sendCode: sendDonationVerificationCodeEmail,
  })
