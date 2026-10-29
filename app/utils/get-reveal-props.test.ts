import { describe, expect, it } from 'vitest'

import { REVEAL_CHAIN_LENGTH } from '~/config/reveal-config'
import { getRevealProps } from './get-reveal-props'

describe('getRevealProps', () => {
  it('chains the first tiles of the page', () => {
    expect(getRevealProps(0)).toEqual({ reveal: 'stagger', staggerIndex: 0 })
    expect(getRevealProps(REVEAL_CHAIN_LENGTH - 1)).toEqual({
      reveal: 'stagger',
      staggerIndex: REVEAL_CHAIN_LENGTH - 1,
    })
  })

  it('leaves items beyond the chain to reveal on scroll', () => {
    expect(getRevealProps(REVEAL_CHAIN_LENGTH)).toEqual({ reveal: 'scroll' })
    expect(getRevealProps(REVEAL_CHAIN_LENGTH * 3)).toEqual({
      reveal: 'scroll',
    })
  })
})
