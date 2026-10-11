import { safeRedirect } from '~/utils/safe-redirect'

/**
 * Carries a sign-in target to the next step of a sign-in flow. The default
 * target adds nothing, so the common URL stays clean.
 *
 * @param path - A sign-in path without a query string.
 * @param redirectTo - Where to land after sign-in; sanitized with `safeRedirect`.
 * @returns The path, with `?redirectTo=…` when the target is not the default.
 */
export const withRedirectTo = (path: string, redirectTo: string) => {
  const target = safeRedirect(redirectTo)

  if (target === safeRedirect(null)) return path

  return `${path}?${new URLSearchParams({ redirectTo: target })}`
}
