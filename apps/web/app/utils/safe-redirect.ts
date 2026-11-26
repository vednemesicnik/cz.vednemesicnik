// A placeholder base to resolve against, not the app's origin; any fixed origin
// works. `.invalid` is a reserved TLD, so it can never be a real host.
const RESOLUTION_BASE = 'http://safe-redirect.invalid'

// ASCII control characters (C0 and DEL). Browsers strip tab, CR and LF while
// parsing a URL, so `/\t/evil.com` would turn into `//evil.com`.
// biome-ignore lint/suspicious/noControlCharactersInRegex: matching control characters is the point
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/

/**
 * Sanitizes a caller-supplied redirect target so it can only point back into
 * this app. Guards against open-redirect: an attacker-controlled `redirectTo`
 * must never send a signed-in user to an external origin.
 *
 * Accepts only same-origin absolute paths. Rejected (→ `fallback`):
 * - empty / non-string values
 * - anything not starting with `/`
 * - values containing an ASCII control character (`/\t/evil.com`)
 * - anything that resolves to another origin, such as protocol-relative URLs
 *   (`//evil.com`, `/\evil.com`)
 *
 * @param to - The requested redirect target.
 * @param fallback - Where to go when `to` is rejected.
 * @returns `to` when it stays on this origin, `fallback` otherwise.
 */
export const safeRedirect = (
  to: FormDataEntryValue | string | null | undefined,
  fallback = '/administration',
) => {
  if (typeof to !== 'string' || to.trim() === '') return fallback

  if (!to.startsWith('/') || CONTROL_CHARACTERS.test(to)) return fallback

  // Resolve the way a browser would: backslashes count as slashes, so `/\`
  // is protocol-relative like `//`. (`new URL` over `URL.parse`: this also
  // runs in the browser, and `URL.parse` needs Safari 18.)
  try {
    if (new URL(to, RESOLUTION_BASE).origin !== RESOLUTION_BASE) {
      return fallback
    }
  } catch {
    return fallback
  }

  return to
}
