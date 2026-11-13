import {
  VERIFICATION_SENDS_PER_ADDRESS,
  VERIFICATION_SENDS_PER_IP,
} from '~/config/membership-application-config'
import {
  type IssueVerificationCodeResult,
  issueVerificationCode,
} from '~/utils/email-verification/issue-verification-code.server'

import { sendVerificationCodeEmail } from './send-verification-code-email.server'

/**
 * Makes the code that confirms the applicant's address and has the membership
 * script mail it (log 0073).
 *
 * @param email - The address, normalised by the caller (lower case).
 * @param request - The request, for the client's IP.
 * @returns See `issueVerificationCode`. Never throws.
 */
export const issueMembershipVerificationCode = (
  email: string,
  request: Request,
): Promise<IssueVerificationCodeResult> =>
  issueVerificationCode({
    email,
    limits: {
      sendsPerAddress: VERIFICATION_SENDS_PER_ADDRESS,
      sendsPerIp: VERIFICATION_SENDS_PER_IP,
    },
    purpose: 'membership-verify',
    request,
    secret: process.env.MEMBERSHIP_VERIFICATION_SECRET ?? '',
    sendCode: sendVerificationCodeEmail,
  })
