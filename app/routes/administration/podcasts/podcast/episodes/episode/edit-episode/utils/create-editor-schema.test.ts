import { parseWithZod } from '@conform-to/zod/v4'
import { describe, expect, test } from 'vitest'

import {
  createEditorSchema,
  INVALID_LINK_URL_MESSAGE,
  TAKEN_NUMBER_MESSAGE,
  TAKEN_SLUG_MESSAGE,
} from './create-editor-schema'

const parse = (
  entries: Record<string, string>,
  taken: { numbers?: string[]; slugs?: string[] } = {},
) => {
  const formData = new FormData()
  formData.set('editTabId', 'tab-1')
  for (const [name, value] of Object.entries(entries)) {
    formData.set(name, value)
  }
  return parseWithZod(formData, {
    schema: createEditorSchema({
      isNumberTaken: (number) => taken.numbers?.includes(number) ?? false,
      isSlugTaken: (slug) => taken.slugs?.includes(slug) ?? false,
    }),
  })
}

describe('createEditorSchema', () => {
  test('a draft passes incomplete', () => {
    expect(parse({ number: '', title: '' }).status).toBe('success')
  })

  test('a number that can’t be read has its own sentence', () => {
    const submission = parse({ number: '2,5' })

    expect(submission.reply().error?.number).toEqual([
      'Zadejte celé číslo větší než nula.',
    ])
    expect(parse({ number: '0' }).reply().error?.number).toEqual([
      'Zadejte celé číslo větší než nula.',
    ])
  })

  test('a taken number and address are errors at their fields', () => {
    const submission = parse(
      { number: '14', slug: 'uvod' },
      { numbers: ['14'], slugs: ['uvod'] },
    )

    expect(submission.reply().error?.number).toEqual([TAKEN_NUMBER_MESSAGE])
    expect(submission.reply().error?.slug).toEqual([TAKEN_SLUG_MESSAGE])
  })

  test('an invalid link address is an error, an empty one is not', () => {
    const submission = parse({
      'links[0].label': 'Spotify',
      'links[0].url': 'open.spotify/13',
      'links[1].label': 'Apple Podcasts',
      'links[1].url': '',
      'links[2].label': '',
      'links[2].url': 'https://kabinet.example/13',
    })

    expect(submission.reply().error).toEqual({
      'links[0].url': [INVALID_LINK_URL_MESSAGE],
    })
  })
})
