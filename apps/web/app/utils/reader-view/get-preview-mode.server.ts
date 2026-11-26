import { getAuthentication } from '~/utils/auth.server'

import { getReaderView } from './get-reader-view.server'

/** How the public web treats this request's unpublished content (10d). */
export type PreviewMode = 'staff' | 'reader' | null

/**
 * Whether this request previews unpublished content on the web: a signed-in
 * author does (`staff`) until they choose the reader view (`reader`); a
 * visitor who is not signed in never does (`null`).
 *
 * @param request - The incoming request.
 * @returns The preview mode.
 */
export const getPreviewMode = async (
  request: Request,
): Promise<PreviewMode> => {
  const { isAuthenticated } = await getAuthentication(request)

  if (!isAuthenticated) return null

  return (await getReaderView(request)) ? 'reader' : 'staff'
}
