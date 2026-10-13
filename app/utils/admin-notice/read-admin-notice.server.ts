import { adminNoticeStorage } from './admin-notice-storage.server'

/**
 * Reads the toast an administration action left for this page, once.
 *
 * @param request - The page's request.
 * @returns `toast` — the toast, or `null`; `setCookie` — the `Set-Cookie`
 *   value that clears it, for the loader's response.
 */
export const readAdminNotice = async (
  request: Request,
): Promise<{ toast: string | null; setCookie: string }> => {
  const cookieSession = await adminNoticeStorage.getSession(
    request.headers.get('Cookie'),
  )

  const toast = cookieSession.get('toast') ?? null

  return {
    setCookie: await adminNoticeStorage.commitSession(cookieSession),
    toast,
  }
}
