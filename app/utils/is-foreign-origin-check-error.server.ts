/**
 * Whether the error is React Router's action origin check rejecting a request
 * whose `Origin` is not our host — scanners POSTing to `www` (which only ever
 * redirects) or from another domain, already answered with 400. The same error
 * with our own host in `Origin` stays reported: a scheme or port mismatch there
 * is the signal of a proxy/origin misconfiguration (#406).
 *
 * @param error - The error passed to `handleError`.
 * @param request - The request that raised it.
 * @returns `true` when the `Origin` host differs from the `BASE_URL` host.
 */
export const isForeignOriginCheckError = (error: unknown, request: Request) => {
  if (
    !(error instanceof Error) ||
    !error.message.includes('does not match `origin` header')
  ) {
    return false
  }

  const origin = request.headers.get('origin')
  if (origin === null || !URL.canParse(origin)) return false

  return new URL(origin).host !== new URL(process.env.BASE_URL).host
}
