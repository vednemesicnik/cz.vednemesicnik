import {
  type SignInNotice,
  signInNoticeStorage,
} from './sign-in-notice-storage.server'

/**
 * Reads the notice a sign-in step left for this page, once.
 *
 * @param request - The page's request.
 * @returns `notice` — the notice, or `null`; `setCookie` — the `Set-Cookie`
 *   value that clears it, for the loader's response.
 */
export const readSignInNotice = async (
  request: Request,
): Promise<{ notice: SignInNotice | null; setCookie: string }> => {
  const cookieSession = await signInNoticeStorage.getSession(
    request.headers.get('Cookie'),
  )

  const notice = cookieSession.get('notice') ?? null

  return {
    notice,
    setCookie: await signInNoticeStorage.commitSession(cookieSession),
  }
}
