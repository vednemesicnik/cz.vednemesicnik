import { describe, expect, test } from 'vitest'

import { getLinkLabelState } from './get-link-label-state'

const SPOTIFY = 'https://open.spotify.com/episode/7hT2'
const UNKNOWN = 'https://kabinet.example/epizody/13'

describe('getLinkLabelState', () => {
  test('the platform of the address is filled from it', () => {
    expect(getLinkLabelState({ label: 'Spotify', url: SPOTIFY })).toBe('filled')
  })

  test('any other name was changed by hand', () => {
    expect(getLinkLabelState({ label: 'Poslechněte si', url: SPOTIFY })).toBe(
      'manual',
    )
    expect(getLinkLabelState({ label: 'Kabinet', url: UNKNOWN })).toBe('manual')
  })

  test('a valid address without a name asks for one', () => {
    expect(getLinkLabelState({ label: '', url: UNKNOWN })).toBe('missing')
    expect(getLinkLabelState({ label: ' ', url: SPOTIFY })).toBe('missing')
  })

  test('says nothing for an invalid or empty address', () => {
    expect(getLinkLabelState({ label: '', url: 'open.spotify/13' })).toBeNull()
    expect(getLinkLabelState({ label: '', url: '' })).toBeNull()
  })
})
