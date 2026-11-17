import { z } from 'zod'

import { VERIFICATION_CODE_LENGTH } from '~/config/email-verification-config'

import { normalizeVerificationCode } from './normalize-verification-code'

const NO_CODE = 'Zadejte kód z e-mailu.'

/** Said by the server when the code has the right shape but is not the one sent. */
export const WRONG_CODE =
  'Kód nesouhlasí. Zkontrolujte ho, nebo si pošlete nový.'

/**
 * The code form of every form that confirms an address (copy thread zup07jj5).
 * The length counts without a space or hyphen typed in it.
 */
export const verificationCodeSchema = z.object({
  code: z
    .string({ message: NO_CODE })
    .transform(normalizeVerificationCode)
    .superRefine((code, context) => {
      if (code === '') {
        context.addIssue({ code: 'custom', message: NO_CODE })
      } else if (code.length !== VERIFICATION_CODE_LENGTH) {
        context.addIssue({
          code: 'custom',
          message: `Kód má ${VERIFICATION_CODE_LENGTH} znaků.`,
        })
      }
    }),
})
