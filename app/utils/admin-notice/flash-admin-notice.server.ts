import { adminNoticeStorage } from './admin-notice-storage.server'

/**
 * Stores a toast for the page an administration action redirects to.
 *
 * @param request - The action's request.
 * @param toast - What the next page says, e.g. „Smazáno“.
 * @returns The `Set-Cookie` value for the redirect.
 */
export const flashAdminNotice = async (request: Request, toast: string) => {
  const cookieSession = await adminNoticeStorage.getSession(
    request.headers.get('Cookie'),
  )

  cookieSession.flash('toast', toast)

  return adminNoticeStorage.commitSession(cookieSession)
}
