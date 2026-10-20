// Shared sort allowlist for the archive (issues) list. Kept server-free so both
// the loader (server) and route component (client) can import it without
// pulling server-only modules into the client bundle. By year and order only
// (design 26a).
export const SORT_KEYS = ['order'] as const
export type SortKey = (typeof SORT_KEYS)[number]
