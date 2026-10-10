import { describe, expect, it } from 'vitest'

import { formatRemainingBackupCodes } from './format-remaining-backup-codes'

describe('formatRemainingBackupCodes', () => {
  it.each([
    [0, 'nezbývá žádný záložní kód'],
    [1, 'zbývá 1 záložní kód'],
    [2, 'zbývají 2 záložní kódy'],
    [4, 'zbývají 4 záložní kódy'],
    [5, 'zbývá 5 záložních kódů'],
    [10, 'zbývá 10 záložních kódů'],
  ])('%i → %s', (count, expected) => {
    expect(formatRemainingBackupCodes(count)).toBe(expected)
  })
})
