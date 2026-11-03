// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'

import { TextField } from './_component'

afterEach(() => {
  cleanup()
})

describe('TextField', () => {
  test('required marks the label and the input', () => {
    render(<TextField id={'email'} label={'E-mail'} required />)

    expect(screen.getByText('*')).toBeTruthy()
    expect(screen.getByRole('textbox').hasAttribute('required')).toBe(true)
  })

  test('isRequiredMarkHidden keeps the input required without the asterisk', () => {
    render(
      <TextField id={'code'} isRequiredMarkHidden label={'Kód'} required />,
    )

    expect(screen.queryByText('*')).toBeNull()
    expect(screen.getByRole('textbox').hasAttribute('required')).toBe(true)
  })

  test('optional says so in the label and stays off the input', () => {
    render(<TextField id={'phone'} label={'Telefon'} optional />)

    const input = screen.getByRole('textbox', { name: 'Telefon (nepovinné)' })

    expect(input.hasAttribute('optional')).toBe(false)
    expect(input.hasAttribute('required')).toBe(false)
  })
})
