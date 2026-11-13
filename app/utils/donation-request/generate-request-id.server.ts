import { randomInt } from 'node:crypto'

import { VERIFICATION_CODE_ALPHABET } from '~/config/email-verification-config'

/**
 * The request's code, `2025-K7M2QX` (design 15l): the year of the donation and
 * six characters without 0/O and 1/I/L. The donor quotes it, and the script
 * stores a request once per code.
 *
 * @param year - The year the confirmation is for.
 * @returns The code.
 */
export const generateRequestId = (year: string): string => {
  let code = ''

  for (let index = 0; index < 6; index++) {
    code +=
      VERIFICATION_CODE_ALPHABET[randomInt(VERIFICATION_CODE_ALPHABET.length)]
  }

  return `${year}-${code}`
}
