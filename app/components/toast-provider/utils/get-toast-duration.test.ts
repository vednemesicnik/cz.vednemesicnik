import { describe, expect, it } from 'vitest'

import { getToastDuration } from './get-toast-duration'

describe('getToastDuration', () => {
  it('gives the durations design g5 lists', () => {
    expect(getToastDuration('Rubrika archivována', 'neutral')).toBe(5000)
    expect(
      getToastDuration('Všechna ostatní přihlášení jsou ukončena.', 'neutral'),
    ).toBe(6500)
    expect(
      getToastDuration(
        'Publikováno: 2 články. Přeskočeno: 1 článek.',
        'neutral',
      ),
    ).toBe(7000)
  })

  it('stays at least 5 s and at most 10 s', () => {
    expect(getToastDuration('Uloženo', 'neutral')).toBe(5000)
    expect(getToastDuration('slovo '.repeat(30), 'neutral')).toBe(10_000)
  })

  it('keeps an error 3 s longer, 8–13 s', () => {
    expect(getToastDuration('Chyba', 'error')).toBe(8000)
    expect(
      getToastDuration('Všechna ostatní přihlášení jsou ukončena.', 'error'),
    ).toBe(9500)
    expect(getToastDuration('slovo '.repeat(30), 'error')).toBe(13_000)
  })
})
