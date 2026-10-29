import { describe, expect, test } from 'vitest'

import { getMissingEpisodeContent } from './get-missing-episode-content'

const COMPLETE = {
  description: 'Pan Kovář se stará o budovu dvacet let.',
  isNumberTaken: false,
  isSlugTaken: false,
  links: [{ label: 'Spotify', url: 'https://open.spotify.com/episode/1' }],
  number: 14,
  title: 'Školník, který ví všechno',
}

describe('getMissingEpisodeContent', () => {
  test('says nothing for a complete episode', () => {
    expect(getMissingEpisodeContent(COMPLETE)).toEqual([])
  })

  test('lists everything missing in one sentence', () => {
    expect(
      getMissingEpisodeContent({
        ...COMPLETE,
        description: ' ',
        links: [],
        number: null,
        title: '',
      }),
    ).toEqual(['Chybí číslo, název, popis a\u00a0odkaz na epizodu.'])
  })

  test('names only what is missing', () => {
    expect(getMissingEpisodeContent({ ...COMPLETE, links: [] })).toEqual([
      'Chybí odkaz na epizodu.',
    ])
    expect(
      getMissingEpisodeContent({ ...COMPLETE, description: '', links: [] }),
    ).toEqual(['Chybí popis a\u00a0odkaz na epizodu.'])
  })

  test('puts the sentences in the editor order', () => {
    expect(
      getMissingEpisodeContent({
        ...COMPLETE,
        description: '',
        isNumberTaken: true,
        isSlugTaken: true,
        links: [{ label: '', url: 'https://kabinet.priklad.cz/13' }],
        number: 13,
      }),
    ).toEqual([
      'Chybí popis.',
      '1 odkaz nemá název platformy.',
      'Číslo 13 je obsazené.',
      'Adresa je obsazená.',
    ])
  })

  test('says only the incomplete links when links are saved', () => {
    expect(
      getMissingEpisodeContent({
        ...COMPLETE,
        links: [{ label: 'Spotify', url: 'open.spotify/13' }],
      }),
    ).toEqual(['1 odkaz nemá platnou adresu.'])
  })

  test('says no taken number without a number', () => {
    expect(
      getMissingEpisodeContent({
        ...COMPLETE,
        isNumberTaken: true,
        number: null,
      }),
    ).toEqual(['Chybí číslo.'])
  })
})
