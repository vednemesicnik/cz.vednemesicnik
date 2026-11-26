// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { useFocusWithin } from './use-focus-within'

const Row = () => {
  const { isFocusWithin, onBlurCapture, onFocusCapture } = useFocusWithin()

  return (
    <>
      <div onBlurCapture={onBlurCapture} onFocusCapture={onFocusCapture}>
        <input aria-label={'inside'} />
        {isFocusWithin && <span>focused</span>}
      </div>
      <button type={'button'}>outside</button>
    </>
  )
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('useFocusWithin', () => {
  test('follows the focus in and out by keyboard at once', () => {
    render(<Row />)

    act(() => screen.getByLabelText('inside').focus())
    expect(screen.queryByText('focused')).not.toBeNull()

    act(() => screen.getByText('outside').focus())
    expect(screen.queryByText('focused')).toBeNull()
  })

  test('keeps the focus in until a press that took it ends', () => {
    vi.useFakeTimers()
    render(<Row />)
    act(() => screen.getByLabelText('inside').focus())

    act(() => {
      document.dispatchEvent(new Event('pointerdown'))
      screen.getByText('outside').focus()
    })
    expect(screen.queryByText('focused')).not.toBeNull()

    act(() => {
      document.dispatchEvent(new Event('pointerup'))
      vi.runAllTimers()
    })
    expect(screen.queryByText('focused')).toBeNull()
  })

  test('stays in when the press brings the focus back', () => {
    vi.useFakeTimers()
    render(<Row />)
    const inside = screen.getByLabelText('inside')
    act(() => inside.focus())

    act(() => {
      document.dispatchEvent(new Event('pointerdown'))
      screen.getByText('outside').focus()
      inside.focus()
      document.dispatchEvent(new Event('pointerup'))
      vi.runAllTimers()
    })
    expect(screen.queryByText('focused')).not.toBeNull()
  })
})
