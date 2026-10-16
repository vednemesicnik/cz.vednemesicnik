import { createdAuthorStorage } from './created-author-storage.server'

type CreatedAuthor = {
  articleId: string
  authorId: string
  /** The author the new one replaces, when the search was a replacement. */
  replacedAuthorId: string | null
}

/**
 * Leaves a newly created author for the article editor the creation started
 * from (design 24j, ivyin4kr): the editor adds it, or puts it in place of the
 * replaced author.
 *
 * @param request - The action's request.
 * @param createdAuthor - The article, the new author and the replaced one.
 * @returns The `Set-Cookie` value for the redirect to the editor.
 */
export const flashCreatedAuthor = async (
  request: Request,
  createdAuthor: CreatedAuthor,
) => {
  const cookieSession = await createdAuthorStorage.getSession(
    request.headers.get('Cookie'),
  )

  cookieSession.flash('createdAuthor', createdAuthor)

  return createdAuthorStorage.commitSession(cookieSession)
}
