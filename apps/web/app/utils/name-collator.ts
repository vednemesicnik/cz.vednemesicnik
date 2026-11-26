/**
 * Orders names the Czech way (CH after H, Š after S) with numbers compared by
 * value, so `2026-2` comes before `2026-10` (design 11c): categories, tags,
 * authors and accounts.
 */
export const nameCollator = new Intl.Collator('cs', { numeric: true })
