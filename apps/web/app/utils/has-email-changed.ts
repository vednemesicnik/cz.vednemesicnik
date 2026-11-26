/**
 * Whether a submitted e-mail is another address than the stored one, compared
 * as the schema stores it (trimmed, lower-cased). An empty field is no change:
 * it has no address to announce.
 *
 * @param storedEmail - The account's address as saved.
 * @param submittedEmail - The field's value, as typed or as submitted.
 * @returns `true` when saving would change the address.
 */
export const hasEmailChanged = (
  storedEmail: string,
  submittedEmail: string | undefined,
) => {
  const normalizedEmail = submittedEmail?.trim().toLowerCase() ?? ''

  return normalizedEmail !== '' && normalizedEmail !== storedEmail.toLowerCase()
}
