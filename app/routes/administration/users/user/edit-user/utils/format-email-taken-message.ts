/**
 * The e-mail field's error for an address another account uses (design 28e).
 * The form renders the name as a link to that account.
 *
 * @param name - The other account's author name.
 */
export const formatEmailTakenMessage = (name: string) =>
  `Zadejte jiný e-mail — tuto adresu už používá účet: ${name}.`
