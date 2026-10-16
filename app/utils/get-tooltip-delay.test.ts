import { describe, expect, test } from 'vitest'

import { getTooltipDelay } from '~/utils/get-tooltip-delay'

describe('getTooltipDelay', () => {
  test('should wait 500 ms when no tooltip hid before', () => {
    expect(getTooltipDelay(10_000, 0)).toBe(500)
  })

  test('should show at once within 300 ms of the last hide', () => {
    expect(getTooltipDelay(10_000, 9_800)).toBe(0)
  })

  test('should wait again from 300 ms after the last hide', () => {
    expect(getTooltipDelay(10_000, 9_700)).toBe(500)
  })
})
