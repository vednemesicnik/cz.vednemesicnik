// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { ChipInput } from './_component'

beforeEach(() => {
  // jsdom has no scrolling; the active option scrolls into view.
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  cleanup()
})

describe('ChipInput', () => {
  test('the open list is out of the Tab order, so Tab leaves the field', () => {
    render(
      <ChipInput
        id={'authors'}
        label={'Přidat autora'}
        onQueryChange={vi.fn()}
        onSelect={vi.fn()}
        options={[{ label: 'Jakub Novák', value: 'author-1' }]}
        query={''}
      />,
    )

    fireEvent.focus(screen.getByRole('combobox'))
    const popup = screen.getByRole('listbox').parentElement

    expect(popup?.hidden).toBe(false)
    expect(popup?.getAttribute('tabindex')).toBe('-1')
  })
})
