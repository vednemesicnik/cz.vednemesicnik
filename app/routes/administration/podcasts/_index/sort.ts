// Shared sort allowlist for the podcasts list. Kept server-free so both the
// loader (server) and route component (client) can import it without pulling
// server-only modules into the client bundle. One order (27a): by the latest
// published episode.
export const SORT_KEYS = ['latestEpisode'] as const
export type SortKey = (typeof SORT_KEYS)[number]
