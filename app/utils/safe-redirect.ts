/**
 * Sanitizes a caller-supplied redirect target so it can only point back into
 * this app. Guards against open-redirect: an attacker-controlled `redirectTo`
 * must never send a signed-in user to an external origin.
 *
 * Accepts only same-origin absolute paths. Rejected (→ `fallback`):
 * - empty / non-string values
 * - protocol-relative URLs (`//evil.com`, `/\evil.com`)
 * - absolute URLs with a scheme (`https://evil.com`, `javascript:…`)
 * - anything not starting with a single `/`
 */
export const safeRedirect = (
  to: FormDataEntryValue | string | null | undefined,
  fallback = '/administration',
) => {
  if (typeof to !== 'string' || to.trim() === '') return fallback

  // Must be an absolute path, but not a protocol-relative one. Backslashes are
  // normalized to slashes by browsers, so `/\` is treated like `//`.
  if (!to.startsWith('/') || to.startsWith('//') || to.startsWith('/\\')) {
    return fallback
  }

  return to
}
