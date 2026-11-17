/**
 * The rules about addresses in the access list, and the words `14b` gives them.
 *
 * Pure, so the field messages are tested here rather than through a page.
 */

/** What the add form adds: a named account or a Google group. Both are an e-mail address. */
export type AccessKind = 'account' | 'group'

/** Addresses are compared lower-cased and trimmed; Google treats them that way too. */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

/**
 * Whether the text has the shape of an address: one `@`, something before it, a dot after it
 * and no whitespace. Deliberately loose, because Google decides what exists; this only stops a
 * typo that could never be one.
 */
export function isEmailShaped(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

/** Whether a normalised address is on the domain, `domain` given without the `@`. */
export function isOnDomain(email: string, domain: string): boolean {
  return domain !== '' && email.endsWith(`@${domain}`)
}

export type AddressCheck = { email: string; ok: true } | { message: string; ok: false }

/** Checks what was typed into the add form, before anything is asked of the database. */
export function checkAddress(kind: AccessKind, value: string, domain: string): AddressCheck {
  let email = normalizeEmail(value)

  if (!isEmailShaped(email)) {
    return { message: 'Zadejte platnou e-mailovou adresu.', ok: false }
  }

  if (!isOnDomain(email, domain)) {
    return {
      message:
        kind === 'account'
          ? `Zadejte adresu @${domain} — jinou se přihlásit nelze.`
          : `Zadejte adresu skupiny na doméně ${domain}.`,
      ok: false,
    }
  }

  return { email, ok: true }
}

/** `14b`, _už je v seznamu_. Only the list is checked, so it says _přidaný_, not _má přístup_. */
export function duplicateMessage(kind: AccessKind, email: string): string {
  return kind === 'account' ? `Účet ${email} už je přidaný.` : `Skupina ${email} už je přidaná.`
}

/** `14b`, the membership service does not know the group (`unknown_group`). */
export function unknownGroupMessage(email: string): string {
  return `Požádejte člověka, který spravuje Google Workspace, o povolení skupiny ${email} pro ověřování členství.`
}

/** `14b`, the membership service did not answer while a group was being added. */
export const MEMBERSHIP_UNAVAILABLE_MESSAGE =
  'Zkuste skupinu přidat za chvíli znovu. Členství teď nelze ověřit.'

/** `14b`, the toast after adding. */
export function addedMessage(kind: AccessKind, email: string): string {
  return kind === 'account' ? `${email} má přístup.` : `Členové skupiny ${email} mají přístup.`
}

/**
 * `14b`, the sentence over the read-only lists and the Callout that points at it.
 *
 * Both take their form from the same count, so they never disagree: _správce_ and _uvedeného_
 * for one administrator, _správci_ and _uvedené_ for more (`6brqgka2`). _Správce_ is the name of
 * the role, so it does not follow the person's gender, which the app does not know.
 */
export function administratorsSentence(names: readonly string[]): string {
  return names.length === 1
    ? `Přístup mění správce: ${names[0]}.`
    : `Přístup mění správci: ${names.join(', ')}.`
}

export function roleLostMessage(administratorCount: number): string {
  let pointer = administratorCount === 1 ? 'uvedeného' : 'uvedené'
  return `Obraťte se na správce ${pointer} níže. Změna se neuložila, protože už nemáte roli správce.`
}
