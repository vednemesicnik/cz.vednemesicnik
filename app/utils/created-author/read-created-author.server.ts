import { createdAuthorStorage } from './created-author-storage.server'

/**
 * Reads, once, the author created for this article's editor (design 24j). One
 * left for another article is consumed and ignored.
 *
 * @param request - The editor loader's request.
 * @param articleId - The article the editor opens.
 * @returns `createdAuthor` — the new author and the one it replaces, or
 *   `null`; `setCookie` — the `Set-Cookie` value that clears it, or `null` when
 *   there was nothing to clear.
 */
export const readCreatedAuthor = async (
  request: Request,
  articleId: string,
): Promise<{
  createdAuthor: { authorId: string; replacedAuthorId: string | null } | null
  setCookie: string | null
}> => {
  const cookieSession = await createdAuthorStorage.getSession(
    request.headers.get('Cookie'),
  )

  const flashed = cookieSession.get('createdAuthor')
  if (flashed === undefined) return { createdAuthor: null, setCookie: null }

  return {
    createdAuthor:
      flashed.articleId === articleId
        ? {
            authorId: flashed.authorId,
            replacedAuthorId: flashed.replacedAuthorId,
          }
        : null,
    setCookie: await createdAuthorStorage.commitSession(cookieSession),
  }
}
