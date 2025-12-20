import { z } from 'zod'

export const getSchema = (positionsCount: number) =>
  z.object({
    authorId: z.string(),
    key: z
      .string({ message: 'Key is required' })
      .regex(/^[a-z-]+$/, {
        message: 'Key must be lowercase and can include hyphens',
      })
      .transform((value) => value.trim()),
    order: z
      .number({ message: 'Order is required' })
      .int()
      .min(1, { message: 'Order must be greater than or equal to 1' })
      .max(positionsCount + 1, {
        message: `Order must be less than or equal to ${positionsCount + 1}`,
      }),
    pluralLabel: z
      .string({ message: 'Plural label is required' })
      .transform((value) => value.trim()),
  })
