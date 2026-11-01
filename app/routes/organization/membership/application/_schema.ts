import { z } from 'zod'

import { membershipDetailsSchema } from '~/utils/membership-application/membership-details-schema'

export const detailsSchema = membershipDetailsSchema

const NO_DECLARATION = 'Nahrajte podepsané prohlášení.'

export const signatureSchema = z.object({
  // A form with nothing picked still sends a file, an empty one without a name.
  declaration: z
    .instanceof(File, { message: NO_DECLARATION })
    .refine((file) => file.size > 0, { message: NO_DECLARATION }),
})
