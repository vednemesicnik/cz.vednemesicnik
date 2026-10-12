// The emergency sign-in link an Administrator issues during a Google outage
// (#578, design 28e/20f).
export const EMERGENCY_SIGN_IN_LINK_CONFIG = {
  // 32 random bytes → 256 bits of entropy, transported base64url in the link.
  tokenBytes: 32,
  // Valid as long as a magic link (MAGIC_LINK_TTL_MS): 15 minutes.
  ttlMs: 15 * 60 * 1000,
} as const
