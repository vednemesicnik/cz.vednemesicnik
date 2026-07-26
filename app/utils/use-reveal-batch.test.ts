import { describe, expect, it } from 'vitest'

import { getRevealProps } from './use-reveal-batch'

describe('getRevealProps', () => {
  it('skips the animation for items an earlier render already revealed', () => {
    expect(getRevealProps(-1, 12)).toEqual({ reveal: 'none' })
    expect(getRevealProps(-12, 12)).toEqual({ reveal: 'none' })
  })

  it('chains the items of the batch, restarting the delay at the first one', () => {
    expect(getRevealProps(0, 12)).toEqual({
      reveal: 'stagger',
      staggerIndex: 0,
    })
    expect(getRevealProps(11, 12)).toEqual({
      reveal: 'stagger',
      staggerIndex: 11,
    })
  })

  it('leaves items beyond the chain to reveal on scroll', () => {
    expect(getRevealProps(12, 12)).toEqual({ reveal: 'scroll' })
    expect(getRevealProps(30, 12)).toEqual({ reveal: 'scroll' })
  })
})
