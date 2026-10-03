import { z } from 'zod'

const notFoundEpisodeDataSchema = z.object({ podcastHref: z.string() })

/**
 * Data of a thrown episode 404 — `data({ podcastHref }, { status: 404 })`. The episode
 * loader sets it only when the podcast itself is public (design 30f).
 */
export type NotFoundEpisodeData = z.infer<typeof notFoundEpisodeDataSchema>

const forbiddenDataSchema = z.discriminatedUnion('cause', [
  z.object({
    actions: z.array(z.object({ href: z.string(), label: z.string() })),
    cause: z.literal('permission'),
    reason: z.string(),
    title: z.string(),
  }),
  z.object({
    cause: z.literal('csrf'),
    href: z.string().optional(),
  }),
])

/**
 * Data of a thrown administration 403 — `data(forbiddenData, { status: 403 })`.
 * `permission` carries the reason the server composed (design 30d); `csrf` marks an
 * invalid form token on an action without its own form, with `href` of the page the
 * action was started from (design 30h). Any other data renders the generic denial.
 */
export type ForbiddenData = z.infer<typeof forbiddenDataSchema>

/**
 * Reads the episode 404 data from an error response.
 *
 * @param data - `error.data` of a route error response.
 * @returns The parsed data, or `null` when the shape doesn't match.
 */
export const parseNotFoundEpisodeData = (
  data: unknown,
): NotFoundEpisodeData | null =>
  notFoundEpisodeDataSchema.safeParse(data).data ?? null

/**
 * Reads the administration 403 data from an error response.
 *
 * @param data - `error.data` of a route error response.
 * @returns The parsed data, or `null` when the shape doesn't match.
 */
export const parseForbiddenData = (data: unknown): ForbiddenData | null =>
  forbiddenDataSchema.safeParse(data).data ?? null
