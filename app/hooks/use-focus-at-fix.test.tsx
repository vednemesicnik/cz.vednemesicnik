// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { OPENS_AT_FIX_STATE } from '~/utils/opens-at-fix-state'

import { useFocusAtFix } from './use-focus-at-fix'

afterEach(() => {
  cleanup()
})

const renderFocus = (state: unknown, isHolding: boolean) => {
  const focusFix = vi.fn()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[{ pathname: '/edit', state }]}>
      {children}
    </MemoryRouter>
  )
  const { rerender } = renderHook(
    (props: { isHolding: boolean }) => useFocusAtFix(props.isHolding, focusFix),
    { initialProps: { isHolding }, wrapper },
  )
  return { focusFix, rerender }
}

describe('useFocusAtFix', () => {
  test('leaves the focus alone on a plain Upravit', () => {
    const { focusFix } = renderFocus(null, true)

    expect(focusFix).not.toHaveBeenCalled()
  })

  test('waits until the editor holds the edit', () => {
    const { focusFix, rerender } = renderFocus(OPENS_AT_FIX_STATE, false)
    expect(focusFix).not.toHaveBeenCalled()

    rerender({ isHolding: true })
    expect(focusFix).toHaveBeenCalledTimes(1)
  })

  test('focuses once, not again when the hold comes back', () => {
    const { focusFix, rerender } = renderFocus(OPENS_AT_FIX_STATE, true)
    rerender({ isHolding: false })
    rerender({ isHolding: true })

    expect(focusFix).toHaveBeenCalledTimes(1)
  })
})
