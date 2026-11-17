import { z } from 'zod'

import { membershipDetailsSchema } from '~/utils/membership-application/membership-details-schema'

export const detailsSchema = membershipDetailsSchema

const NO_DECLARATION = 'Nahrajte podepsané prohlášení.'

/** Said in the browser on a pick and by the server on a submit. */
export const DECLARATION_NOT_RECOGNISED =
  'Soubor se nepodařilo rozpoznat jako PDF, JPEG ani PNG. Nahrajte ho prosím v jednom z těchto formátů.'

export {
  verificationCodeSchema,
  WRONG_CODE,
} from '~/utils/email-verification/verification-code-schema'

export const signatureSchema = z.object({
  // A form with nothing picked still sends a file, an empty one without a name.
  declaration: z
    .instanceof(File, { message: NO_DECLARATION })
    .refine((file) => file.size > 0, { message: NO_DECLARATION }),
})
