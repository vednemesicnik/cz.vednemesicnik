// How long AuthLog keeps its rows (log 0004); the users list reads a missing
// sign-in against the same window (28d, log 0040).
export const AUTH_LOG_CONFIG = {
  retentionDays: 90,
} as const
