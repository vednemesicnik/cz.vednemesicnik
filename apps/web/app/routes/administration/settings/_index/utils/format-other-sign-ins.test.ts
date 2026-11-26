import { describe, expect, it } from 'vitest'

import { formatOtherSignIns } from './format-other-sign-ins'

describe('formatOtherSignIns', () => {
  it.each([
    [1, 'Účet má 1 další platné přihlášení.'],
    [2, 'Účet má 2 další platná přihlášení.'],
    [4, 'Účet má 4 další platná přihlášení.'],
    [5, 'Účet má 5 dalších platných přihlášení.'],
    [22, 'Účet má 22 dalších platných přihlášení.'],
  ])('%i → %s', (count, expected) => {
    expect(formatOtherSignIns(count)).toBe(expected)
  })
})
