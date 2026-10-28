import { describe, expect, test } from 'vitest'

import { getMissingPodcastContent } from './get-missing-podcast-content'

const COMPLETE = {
  description: 'O škole.',
  hasCover: true,
  isSlugTaken: false,
  slug: 'prestavka',
  title: 'Přestávka',
}

describe('getMissingPodcastContent', () => {
  test('a complete podcast lacks nothing', () => {
    expect(getMissingPodcastContent(COMPLETE)).toEqual([])
  })

  test('names one missing part (27i)', () => {
    expect(getMissingPodcastContent({ ...COMPLETE, hasCover: false })).toEqual([
      'Chybí obálka.',
    ])
    expect(getMissingPodcastContent({ ...COMPLETE, slug: '' })).toEqual([
      'Chybí adresa.',
    ])
  })

  test('lists what is missing in one sentence, in the editor’s order', () => {
    expect(
      getMissingPodcastContent({
        ...COMPLETE,
        description: ' ',
        hasCover: false,
      }),
    ).toEqual(['Chybí popis a obálka.'])
    expect(
      getMissingPodcastContent({
        description: '',
        hasCover: false,
        isSlugTaken: false,
        slug: '',
        title: '',
      }),
    ).toEqual(['Chybí název, adresa, popis a obálka.'])
  })

  test('the taken address is its own sentence after the list', () => {
    expect(
      getMissingPodcastContent({
        ...COMPLETE,
        hasCover: false,
        isSlugTaken: true,
      }),
    ).toEqual(['Chybí obálka.', 'Adresa je obsazená.'])
    expect(
      getMissingPodcastContent({ ...COMPLETE, isSlugTaken: true }),
    ).toEqual(['Adresa je obsazená.'])
  })
})
