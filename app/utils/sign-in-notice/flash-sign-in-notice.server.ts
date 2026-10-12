import {
  type SignInNotice,
  signInNoticeStorage,
} from './sign-in-notice-storage.server'

/**
 * Stores a notice for the page a sign-in step redirects to.
 *
 * @param request - The request of the step.
 * @param notice - What the next page shows.
 * @returns The `Set-Cookie` value for the redirect.
 */
export const flashSignInNotice = async (
  request: Request,
  notice: SignInNotice,
) => {
  const cookieSession = await signInNoticeStorage.getSession(
    request.headers.get('Cookie'),
  )

  cookieSession.flash('notice', notice)

  return signInNoticeStorage.commitSession(cookieSession)
}
