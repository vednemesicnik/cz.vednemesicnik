// Shared sort allowlist for a podcast's episode table. Kept server-free so
// both the loader (server) and route component (client) can import it without
// pulling server-only modules into the client bundle. Číslo is the one order
// (27b): the number is how the editors and the listeners know an episode.
export const SORT_KEYS = ['number'] as const
export type SortKey = (typeof SORT_KEYS)[number]
