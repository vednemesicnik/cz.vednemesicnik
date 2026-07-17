// Shared sort allowlist for the articles list. Kept server-free so both the
// loader (server) and route component (client) can import it without pulling
// server-only modules into the client bundle.
export const SORT_KEYS = ['title', 'createdAt'] as const
export type SortKey = (typeof SORT_KEYS)[number]
