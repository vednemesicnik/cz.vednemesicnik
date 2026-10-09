import { z } from 'zod'

const notFoundPageDataSchema = z.object({ cause: z.literal('page-past-last') })

/**
 * Data of a thrown list 404 for a page past the last —
 * `data({ cause: 'page-past-last' }, { status: 404 })`. The list itself exists, so
 * a category or tag page shows the generic page copy instead of its own (#512).
 */
export type NotFoundPageData = z.infer<typeof notFoundPageDataSchema>

/**
 * Reads the page-past-the-last 404 data from an error response.
 *
 * @param data - `error.data` of a route error response.
 * @returns The parsed data, or `null` when the shape doesn't match.
 */
export const parseNotFoundPageData = (data: unknown): NotFoundPageData | null =>
  notFoundPageDataSchema.safeParse(data).data ?? null
