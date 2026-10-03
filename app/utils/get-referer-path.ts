/**
 * The path of the administration page a form was submitted from, read from the
 * `Referer` header. Only the path is kept, so the host never matters; callers that
 * redirect to it still run it through `safeRedirect`.
 *
 * @param request - The submitted request.
 * @returns The path with its search, or `undefined` when the header is missing,
 *   unparseable or points outside the administration.
 */
export const getRefererPath = (request: Request): string | undefined => {
  const referer = request.headers.get('Referer')

  if (referer === null) return undefined

  try {
    const { pathname, search } = new URL(referer)

    return pathname.startsWith('/administration')
      ? pathname + search
      : undefined
  } catch {
    return undefined
  }
}
