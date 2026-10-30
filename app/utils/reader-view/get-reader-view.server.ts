import { readerViewCookie } from './reader-view-cookie.server'

/**
 * Reads whether this request views the web as a reader (10d).
 *
 * @param request - The incoming request.
 * @returns `true` once *Zobrazit jako čtenář* was chosen in this browser session.
 */
export const getReaderView = async (request: Request) =>
  (await readerViewCookie.parse(request.headers.get('Cookie'))) === true
