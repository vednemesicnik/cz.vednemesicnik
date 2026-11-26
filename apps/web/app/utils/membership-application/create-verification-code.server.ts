import { createHmac } from 'node:crypto'

import {
  CODE_ALPHABET,
  VERIFICATION_CODE_LENGTH,
} from '~/config/membership-application-config'

/**
 * The code that confirms the applicant's address (#972). It is stored nowhere:
 * the app makes it again from the address and the moment it was sent, which
 * travel in the signed cookie, so only the e-mail ever holds it (log 0073).
 *
 * The digest is read as one number and written in base 31, so every character
 * of the alphabet is as likely as the next.
 *
 * @param secret - `MEMBERSHIP_VERIFICATION_SECRET`, used for nothing else.
 * @param email - The applicant's address; compared without case.
 * @param issuedAt - When the code was sent, in milliseconds.
 * @returns Eight characters of the code alphabet.
 * @throws When the secret is empty.
 */
export const createVerificationCode = (
  secret: string,
  email: string,
  issuedAt: number,
): string => {
  if (secret === '') throw new Error('The verification secret is empty.')

  const digest = createHmac('sha256', secret)
    .update(`membership-verify|${email.toLowerCase()}|${issuedAt}`)
    .digest('hex')
  const base = BigInt(CODE_ALPHABET.length)
  let value = BigInt(`0x${digest}`)
  let code = ''

  for (let index = 0; index < VERIFICATION_CODE_LENGTH; index++) {
    code += CODE_ALPHABET[Number(value % base)]
    value /= base
  }

  return code
}
