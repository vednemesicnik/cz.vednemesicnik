/**
 * Says how many other sign-ins the account has, in the Czech plural the count
 * needs (design 29a, copy wprzdkhd: „Účet má 1 další platné přihlášení.“ ·
 * „Účet má 2 další platná přihlášení.“ · „Účet má 5 dalších platných
 * přihlášení.“). A sign-in is one browser's session, not a device.
 *
 * @param count - Unexpired sessions of the account besides the current one; the
 * block is hidden at zero, so there is no zero form.
 * @returns The sentence shown above the button that ends them.
 */
export const formatOtherSignIns = (count: number): string => {
  if (count === 1) {
    return 'Účet má 1 další platné přihlášení.'
  }

  if (count <= 4) {
    return `Účet má ${count} další platná přihlášení.`
  }

  return `Účet má ${count} dalších platných přihlášení.`
}
