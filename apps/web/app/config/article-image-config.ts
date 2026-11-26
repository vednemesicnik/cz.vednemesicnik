export const ARTICLE_IMAGE_CONFIG = {
  format: 'jpeg' as const,
  height: 1200,
  // One picked file at most, refused already at selection (design 24b).
  maxFileBytes: 10 * 1024 * 1024,
  quality: 85,
  width: 1800,
} as const
