// Autosave of a Document (design 24e, log 0022).
export const AUTOSAVE_CONFIG = {
  // A save goes about a second after the last keystroke.
  debounceMilliseconds: 1000,
  // `keepalive` requests carry at most 64 KB in all; the rest is headroom.
  keepaliveLimitBytes: 60 * 1024,
  // „ukládá se“ stays at least this long, so the line does not blink.
  minimumSavingMilliseconds: 300,
  // Without a network the editor tries again by itself.
  offlineRetryMilliseconds: 10 * 1000,
} as const
