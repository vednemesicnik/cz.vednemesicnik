import { createCookie, createCookieSessionStorage } from 'react-router'

type CreatedAuthorFlashData = {
  createdAuthor: {
    articleId: string
    authorId: string
    replacedAuthorId: string | null
  }
}

// Carries an author created from an article's author search back to its
// editor, once (design 24j). A cookie, not the address, so no link can change
// an article's authors. `/administration`, not the editor's own path: its
// Single Fetch request is `….data`, which an exact path doesn't match.
export const createdAuthorStorage = createCookieSessionStorage<
  Record<string, never>,
  CreatedAuthorFlashData
>({
  cookie: createCookie('vdm_created_author', {
    httpOnly: true,
    maxAge: 10 * 60,
    path: '/administration',
    sameSite: 'lax',
    secrets: process.env.SESSION_SECRET?.split(','),
    secure: process.env.NODE_ENV === 'production',
  }),
})
