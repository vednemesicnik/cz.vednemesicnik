// Uniform, role-independent compression quality. An image may move between
// in-content and featured slots, so quality must not depend on its role.
// AVIF and JPEG use different scales — AVIF q58 ≈ JPEG q80 visually.
export const IMAGE_QUALITY_CONFIG = {
  avif: {
    // Higher effort → smaller files at the cost of a slower upload (off the hot
    // read path, so acceptable).
    effort: 4,
    quality: 58,
  },
  jpeg: {
    mozjpeg: true,
    progressive: true,
    quality: 80,
  },
  // Tiny placeholder encoded as an inline JPEG data URI, rendered pixelated on
  // the client. JPEG (not AVIF) because at ~20px the AVIF container overhead
  // (~300 B) outweighs its savings.
  lqip: {
    quality: 40,
  },
} as const
