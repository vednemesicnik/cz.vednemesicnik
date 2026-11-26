/**
 * Says how many backup codes are left, in the Czech plural the count needs
 * (design 29a: „zbývá 1 záložní kód“ · „zbývají 2 záložní kódy“ ·
 * „zbývá 5 záložních kódů“ · „nezbývá žádný záložní kód“).
 *
 * @param count - Unused backup codes.
 * @returns The lowercase phrase shown next to the two-factor status.
 */
export const formatRemainingBackupCodes = (count: number): string => {
  if (count === 0) {
    return 'nezbývá žádný záložní kód'
  }

  if (count === 1) {
    return 'zbývá 1 záložní kód'
  }

  if (count <= 4) {
    return `zbývají ${count} záložní kódy`
  }

  return `zbývá ${count} záložních kódů`
}
