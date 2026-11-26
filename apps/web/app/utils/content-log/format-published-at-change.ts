/**
 * Writes a publish-date change into the `set_published_at` detail, which the
 * history reads back as „z 19. 9. 2026 na 18. 9. 2026“ (07f).
 *
 * @param from - The publish date before the change, `null` when there was none.
 * @param to - The new publish date.
 * @returns `"<from ISO> → <to ISO>"`, or `"→ <to ISO>"` without a previous date.
 */
export const formatPublishedAtChange = (from: Date | null, to: Date): string =>
  `${from === null ? '' : `${from.toISOString()} `}→ ${to.toISOString()}`
