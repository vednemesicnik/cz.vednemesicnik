import { describe, expect, test } from 'vitest'

import { flashCreatedAuthor } from './flash-created-author.server'
import { readCreatedAuthor } from './read-created-author.server'

const requestWith = (setCookie: string) =>
  new Request('https://test.local/administration/articles/a1/edit-article', {
    headers: { Cookie: setCookie.split(';')[0] },
  })

const flash = () =>
  flashCreatedAuthor(
    new Request('https://test.local/administration/authors/new'),
    { articleId: 'a1', authorId: 'author-new', replacedAuthorId: 'author-old' },
  )

describe('readCreatedAuthor', () => {
  test('reads nothing without the cookie', async () => {
    const result = await readCreatedAuthor(
      new Request('https://test.local/administration/articles/a1/edit-article'),
      'a1',
    )

    expect(result).toEqual({ createdAuthor: null, setCookie: null })
  })

  test('reads the created author for its article once', async () => {
    const first = await readCreatedAuthor(requestWith(await flash()), 'a1')
    expect(first.createdAuthor).toEqual({
      authorId: 'author-new',
      replacedAuthorId: 'author-old',
    })
    expect(first.setCookie).not.toBeNull()

    const second = await readCreatedAuthor(
      requestWith(first.setCookie ?? ''),
      'a1',
    )
    expect(second.createdAuthor).toBeNull()
  })

  test('consumes and ignores one left for another article', async () => {
    const result = await readCreatedAuthor(requestWith(await flash()), 'a2')

    expect(result.createdAuthor).toBeNull()
    expect(result.setCookie).not.toBeNull()
  })
})
