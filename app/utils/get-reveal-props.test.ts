import { describe, expect, it } from 'vitest'

import { LIMIT_STEP } from '~/config/load-more-config'
import { getRevealProps } from './get-reveal-props'

describe('getRevealProps', () => {
  it('skips the animation for items an earlier render already revealed', () => {
    expect(getRevealProps(-1)).toEqual({ reveal: 'none' })
    expect(getRevealProps(-LIMIT_STEP)).toEqual({ reveal: 'none' })
  })

  it('chains the items of the batch, restarting the delay at the first one', () => {
    expect(getRevealProps(0)).toEqual({ reveal: 'stagger', staggerIndex: 0 })
    expect(getRevealProps(LIMIT_STEP - 1)).toEqual({
      reveal: 'stagger',
      staggerIndex: LIMIT_STEP - 1,
    })
  })

  it('leaves items beyond the chain to reveal on scroll', () => {
    expect(getRevealProps(LIMIT_STEP)).toEqual({ reveal: 'scroll' })
    expect(getRevealProps(LIMIT_STEP * 3)).toEqual({ reveal: 'scroll' })
  })
})
