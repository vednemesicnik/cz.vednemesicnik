import { z } from 'zod'

// The link is created only once the identity check is ticked (design 28e).
export const schema = z.object({
  identityConfirmed: z.literal('on'),
})
