// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'

import { Label } from './_component'

afterEach(() => {
  cleanup()
})

describe('Label', () => {
  test('the asterisk is hidden from readers and left out of the name', () => {
    render(
      <>
        <Label htmlFor={'first-name'} required>
          Jméno
        </Label>
        <input id={'first-name'} />
      </>,
    )

    expect(screen.getByText('*').getAttribute('aria-hidden')).toBe('true')
    expect(screen.getByRole('textbox', { name: 'Jméno' })).toBeTruthy()
  })

  test('„(nepovinné)“ is part of the name', () => {
    render(
      <>
        <Label htmlFor={'phone'} optional>
          Telefon
        </Label>
        <input id={'phone'} />
      </>,
    )

    expect(
      screen.getByRole('textbox', { name: 'Telefon (nepovinné)' }),
    ).toBeTruthy()
    expect(screen.queryByText('*')).toBeNull()
  })
})
