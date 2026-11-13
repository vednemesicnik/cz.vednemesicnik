import { createHmac } from 'node:crypto'

import {
  VERIFICATION_CODE_ALPHABET,
  VERIFICATION_CODE_LENGTH,
  type VerificationPurpose,
} from '~/config/email-verification-config'

type CreateVerificationCodeOptions = {
  email: string
  issuedAt: number
  purpose: VerificationPurpose
  secret: string
}

/**
 * The code that confirms an address someone typed into a form (#972, #104). It
 * is stored nowhere: the app makes it again from the address and the moment it
 * was sent, which travel in the signed cookie, so only the e-mail ever holds it
 * (log 0073).
 *
 * The digest is read as one number and written in base 31, so every character
 * of the alphabet is as likely as the next.
 *
 * @param options - The form's own secret (`MEMBERSHIP_VERIFICATION_SECRET`,
 *   `DONATION_VERIFICATION_SECRET`), what the code confirms, the address
 *   (compared without case) and when the code was sent, in milliseconds.
 * @returns Eight characters of the code alphabet.
 * @throws When the secret is empty.
 */
export const createVerificationCode = ({
  email,
  issuedAt,
  purpose,
  secret,
}: CreateVerificationCodeOptions): string => {
  if (secret === '') throw new Error('The verification secret is empty.')

  const digest = createHmac('sha256', secret)
    .update(`${purpose}|${email.toLowerCase()}|${issuedAt}`)
    .digest('hex')
  const base = BigInt(VERIFICATION_CODE_ALPHABET.length)
  let value = BigInt(`0x${digest}`)
  let code = ''

  for (let index = 0; index < VERIFICATION_CODE_LENGTH; index++) {
    code += VERIFICATION_CODE_ALPHABET[Number(value % base)]
    value /= base
  }

  return code
}
