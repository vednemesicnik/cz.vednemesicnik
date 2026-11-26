// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'

import { TextFieldControl } from '~/components/text-field-control'
import { TextFieldHint } from '~/components/text-field-hint'
import { TextFieldLabel } from '~/components/text-field-label'

import { TextField } from './_component'

afterEach(() => {
  cleanup()
})

describe('TextField', () => {
  test('required marks the label and the input', () => {
    render(
      <TextField id={'email'} required>
        <TextFieldLabel>E-mail</TextFieldLabel>
        <TextFieldControl />
      </TextField>,
    )

    expect(screen.getByText('*')).toBeTruthy()
    expect(screen.getByRole('textbox').hasAttribute('required')).toBe(true)
  })

  test('isRequiredMarkHidden keeps the input required without the asterisk', () => {
    render(
      <TextField id={'code'} required>
        <TextFieldLabel isRequiredMarkHidden>Kód</TextFieldLabel>
        <TextFieldControl />
      </TextField>,
    )

    expect(screen.queryByText('*')).toBeNull()
    expect(screen.getByRole('textbox').hasAttribute('required')).toBe(true)
  })

  test('optional says so in the label and stays off the input', () => {
    render(
      <TextField id={'phone'}>
        <TextFieldLabel optional>Telefon</TextFieldLabel>
        <TextFieldControl />
      </TextField>,
    )

    const input = screen.getByRole('textbox', { name: 'Telefon (nepovinné)' })

    expect(input.hasAttribute('optional')).toBe(false)
    expect(input.hasAttribute('required')).toBe(false)
  })

  test('the field id wins over one passed to the control', () => {
    render(
      <TextField id={'name'}>
        <TextFieldLabel>Jméno</TextFieldLabel>
        <TextFieldControl id={'other'} />
      </TextField>,
    )

    expect(screen.getByRole('textbox', { name: 'Jméno' }).id).toBe('name')
  })

  test('errors mark the input invalid and show under it', () => {
    render(
      <TextField errors={['Zadejte rok.']} id={'year'}>
        <TextFieldLabel>Rok</TextFieldLabel>
        <TextFieldControl />
      </TextField>,
    )

    expect(
      screen.getByRole('textbox', { name: 'Rok' }).getAttribute('aria-invalid'),
    ).toBe('true')
    expect(screen.getByRole('alert').textContent).toBe('Zadejte rok.')
  })

  test('the hint describes the input', () => {
    render(
      <TextField id={'name'}>
        <TextFieldLabel>Název</TextFieldLabel>
        <TextFieldControl />
        <TextFieldHint>Bez roku.</TextFieldHint>
      </TextField>,
    )

    expect(
      screen.getByRole('textbox', { description: 'Bez roku.' }),
    ).toBeTruthy()
  })
})
