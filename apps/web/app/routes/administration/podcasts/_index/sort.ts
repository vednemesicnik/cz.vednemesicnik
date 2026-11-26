// The podcast list's one order (27a): by the latest published episode. It is
// parsed so that an old ?sort=title or ?sort=createdAt falls back to it.
export const SORT_KEYS = ['latestEpisode'] as const
export type SortKey = (typeof SORT_KEYS)[number]
