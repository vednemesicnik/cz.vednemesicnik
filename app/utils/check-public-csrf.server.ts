import { createFormRefusal, isValidCSRF } from '~/utils/csrf.server'

/**
 * `checkCSRF` for a public form, whose sender has no session to check. The route has
 * to reissue the token itself: its `shouldRevalidate` runs its loader after a 403.
 *
 * @param formData - The submitted form data.
 * @param request - The submitted request.
 * @param message - The form's own wording, as the administration's does not fit.
 * @returns `null` for a valid token, otherwise the response the action returns.
 */
export const checkPublicCSRF = async (
  formData: FormData,
  request: Request,
  message: string,
) => {
  if (await isValidCSRF(formData, request.headers)) return null

  return createFormRefusal(formData, message)
}
