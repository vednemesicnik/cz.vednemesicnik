import { z } from "zod"

export const getSchema = (positionsCount: number) =>
  z.object({
    id: z.string(),
    key: z
      .string({ message: "Key is required" })
      .regex(/^[a-z-]+$/, {
        message: "Key must be lowercase and can include hyphens",
      })
      .transform((value) => value.trim()),
    pluralLabel: z
      .string({ message: "Plural label is required" })
      .transform((value) => value.trim()),
    newOrder: z
      .number({ message: "Order is required" })
      .int()
      .min(1, { message: "Order must be greater than or equal to 1" })
      .max(positionsCount, {
        message: `Order must be less than or equal to ${positionsCount}`,
      }),
    currentOrder: z.number().int().min(1).max(positionsCount),
    authorId: z.string(),
  })
