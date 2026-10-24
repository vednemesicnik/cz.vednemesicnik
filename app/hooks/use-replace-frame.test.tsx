// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { useReplaceFrame } from './use-replace-frame'

afterEach(() => {
  cleanup()
})

type HarnessProps = {
  onOuterKeyDown?: () => void
  onRefocus?: (key: string) => void
}

// A row with Vyměnit, the frame with Zrušit, the name and the search while
// replacing, and a button outside the frame.
const Harness = ({ onOuterKeyDown, onRefocus }: HarnessProps) => {
  const replaceRef = useRef<HTMLButtonElement>(null)
  const frame = useReplaceFrame<string>({
    onRefocus: (key) => {
      onRefocus?.(key)
      replaceRef.current?.focus()
    },
  })
  const isReplacing = frame.replacingKey !== null

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: listens for an Esc that leaks out
    <div onKeyDown={onOuterKeyDown}>
      <div data-testid={'frame'} {...frame.frameProps}>
        <span>Jakub Novák</span>
        {isReplacing ? (
          <button onClick={() => frame.stop({ refocus: true })} type={'button'}>
            Zrušit
          </button>
        ) : (
          <button
            onClick={() => frame.start('author-1')}
            ref={replaceRef}
            type={'button'}
          >
            Vyměnit
          </button>
        )}
        {isReplacing && (
          <input
            aria-label={'Vybrat jiného autora'}
            onChange={(event) => frame.setQuery(event.target.value)}
            ref={frame.searchRef}
            value={frame.query}
          />
        )}
      </div>
      <button type={'button'}>Jinde</button>
      <output data-testid={'state'}>{frame.replacingKey ?? 'none'}</output>
    </div>
  )
}

const startReplacing = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Vyměnit' }))
}

describe('useReplaceFrame (24j, 28f)', () => {
  test('start puts the focus into an empty search', () => {
    render(<Harness />)

    startReplacing()
    const search = screen.getByRole('textbox')
    fireEvent.change(search, { target: { value: 'Pavel' } })
    fireEvent.click(screen.getByRole('button', { name: 'Zrušit' }))
    startReplacing()

    expect(screen.getByRole('textbox')).toHaveProperty('value', '')
    expect(document.activeElement).toBe(screen.getByRole('textbox'))
    expect(screen.getByTestId('state').textContent).toBe('author-1')
  })

  test('Esc ends it, refocuses the row and goes no further', () => {
    const onOuterKeyDown = vi.fn()
    const onRefocus = vi.fn()
    render(<Harness onOuterKeyDown={onOuterKeyDown} onRefocus={onRefocus} />)

    startReplacing()
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' })

    expect(screen.getByTestId('state').textContent).toBe('none')
    expect(onRefocus).toHaveBeenCalledWith('author-1')
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Vyměnit' }),
    )
    expect(onOuterKeyDown).not.toHaveBeenCalled()
  })

  test('another key in the frame changes nothing', () => {
    const onOuterKeyDown = vi.fn()
    render(<Harness onOuterKeyDown={onOuterKeyDown} />)

    startReplacing()
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'ArrowDown' })

    expect(screen.getByTestId('state').textContent).toBe('author-1')
    expect(onOuterKeyDown).toHaveBeenCalledOnce()
  })

  test('Zrušit ends it and refocuses the row', () => {
    render(<Harness />)

    startReplacing()
    fireEvent.click(screen.getByRole('button', { name: 'Zrušit' }))

    expect(screen.getByTestId('state').textContent).toBe('none')
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Vyměnit' }),
    )
  })

  test('leaving the frame ends it and leaves the focus where it went', () => {
    const onRefocus = vi.fn()
    render(<Harness onRefocus={onRefocus} />)

    startReplacing()
    const outside = screen.getByRole('button', { name: 'Jinde' })
    fireEvent.blur(screen.getByRole('textbox'), { relatedTarget: outside })

    expect(screen.getByTestId('state').textContent).toBe('none')
    expect(onRefocus).not.toHaveBeenCalled()
  })

  test('a move inside the frame is no leaving', () => {
    render(<Harness />)

    startReplacing()
    fireEvent.blur(screen.getByRole('textbox'), {
      relatedTarget: screen.getByRole('button', { name: 'Zrušit' }),
    })

    expect(screen.getByTestId('state').textContent).toBe('author-1')
  })

  test('a press in the frame keeps the focus, except in the search', () => {
    render(<Harness />)

    startReplacing()
    const onName = fireEvent.mouseDown(screen.getByText('Jakub Novák'))
    const onCancel = fireEvent.mouseDown(
      screen.getByRole('button', { name: 'Zrušit' }),
    )
    const onSearch = fireEvent.mouseDown(screen.getByRole('textbox'))

    // fireEvent returns false when the default was prevented.
    expect(onName).toBe(false)
    expect(onCancel).toBe(false)
    expect(onSearch).toBe(true)
  })

  test('with nothing replaced, the frame listens to nothing', () => {
    const onOuterKeyDown = vi.fn()
    render(<Harness onOuterKeyDown={onOuterKeyDown} />)

    const onName = fireEvent.mouseDown(screen.getByText('Jakub Novák'))
    fireEvent.keyDown(screen.getByRole('button', { name: 'Vyměnit' }), {
      key: 'Escape',
    })

    expect(onName).toBe(true)
    expect(onOuterKeyDown).toHaveBeenCalledOnce()
  })
})
