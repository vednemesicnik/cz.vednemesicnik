/**
 * What `getWebPreviewState` reads, to spread into a public loader's `select`
 * for each piece of content it may preview (10d).
 */
export const WEB_PREVIEW_STATE_SELECT = {
  reviews: {
    select: {
      createdAt: true,
      reviewer: { select: { role: { select: { level: true } } } },
    },
  },
  state: true,
  submittedAt: true,
} as const
