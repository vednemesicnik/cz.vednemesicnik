import { z } from 'zod'

export const schema = z.object({
  authorId: z.string(),
  fullName: z.string({ message: 'Full name is required' }),
  positionIds: z
    .array(z.string())
    .min(1, { message: 'At least one position must be selected' }),
})
