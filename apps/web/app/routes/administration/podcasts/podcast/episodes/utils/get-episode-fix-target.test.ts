import { describe, expect, test } from 'vitest'

import { getEpisodeFixTarget } from './get-episode-fix-target'

const link = { label: 'Spotify', url: 'https://open.spotify.com/episode/1' }

const complete = {
  description: 'Popis',
  isNumberTaken: false,
  isSlugTaken: false,
  links: [link],
  number: 13,
  title: 'Paní Vránová',
}

describe('getEpisodeFixTarget', () => {
  test('a complete episode has nothing to fix', () => {
    expect(getEpisodeFixTarget(complete)).toBeNull()
  })

  test('each missing item maps to its field', () => {
    expect(getEpisodeFixTarget({ ...complete, title: ' ' })).toEqual({
      field: 'title',
    })
    expect(getEpisodeFixTarget({ ...complete, description: '' })).toEqual({
      field: 'description',
    })
    expect(getEpisodeFixTarget({ ...complete, number: null })).toEqual({
      field: 'number',
    })
  })

  test('an episode without a link opens at the empty row’s address', () => {
    expect(getEpisodeFixTarget({ ...complete, links: [] })).toEqual({
      field: 'linkUrl',
      index: 0,
    })
  })

  test('an incomplete link opens its first row: the empty name, else the address', () => {
    expect(
      getEpisodeFixTarget({
        ...complete,
        links: [link, { label: '', url: link.url }],
      }),
    ).toEqual({ field: 'linkLabel', index: 1 })
    expect(
      getEpisodeFixTarget({
        ...complete,
        links: [
          { label: 'Web', url: 'adresa' },
          { label: '', url: '' },
        ],
      }),
    ).toEqual({ field: 'linkUrl', index: 0 })
    expect(
      getEpisodeFixTarget({
        ...complete,
        links: [{ label: '', url: 'adresa' }],
      }),
    ).toEqual({ field: 'linkLabel', index: 0 })
  })

  test('the editor’s order: content first, then the number', () => {
    expect(
      getEpisodeFixTarget({
        ...complete,
        description: '',
        links: [],
        number: null,
      }),
    ).toEqual({ field: 'description' })
  })

  test('a taken number or address opens its field when nothing is missing', () => {
    expect(getEpisodeFixTarget({ ...complete, isNumberTaken: true })).toEqual({
      field: 'number',
    })
    expect(getEpisodeFixTarget({ ...complete, isSlugTaken: true })).toEqual({
      field: 'slug',
    })
    expect(
      getEpisodeFixTarget({
        ...complete,
        isNumberTaken: true,
        isSlugTaken: true,
      }),
    ).toEqual({ field: 'number' })
  })
})
