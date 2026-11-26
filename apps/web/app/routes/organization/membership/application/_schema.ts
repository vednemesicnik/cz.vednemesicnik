import { z } from 'zod'

import { VERIFICATION_CODE_LENGTH } from '~/config/membership-application-config'
import { membershipDetailsSchema } from '~/utils/membership-application/membership-details-schema'
import { normalizeVerificationCode } from '~/utils/membership-application/normalize-verification-code'

export const detailsSchema = membershipDetailsSchema

const NO_DECLARATION = 'Nahrajte podepsané prohlášení.'

/** Said in the browser on a pick and by the server on a submit. */
export const DECLARATION_NOT_RECOGNISED =
  'Soubor se nepodařilo rozpoznat jako PDF, JPEG ani PNG. Nahrajte ho prosím v jednom z těchto formátů.'

const NO_CODE = 'Zadejte kód z e-mailu.'

/** Said by the server when the code has the right shape but is not the one sent. */
export const WRONG_CODE =
  'Kód nesouhlasí. Zkontrolujte ho, nebo si pošlete nový.'

// Copy thread zup07jj5. The length counts without a space or hyphen typed in it.
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

export const signatureSchema = z.object({
  // A form with nothing picked still sends a file, an empty one without a name.
  declaration: z
    .instanceof(File, { message: NO_DECLARATION })
    .refine((file) => file.size > 0, { message: NO_DECLARATION }),
})
