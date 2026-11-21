/**
 * The rules about addresses in the access list, and the words `14b` gives them.
 *
 * Pure, so the field messages are tested here rather than through a page.
 */

import { tied } from './public/typography.ts'

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
  return tied`Požádejte člověka, který spravuje Google Workspace, o povolení skupiny ${email} pro ověřování členství.`
}

/** `14b`, the membership service did not answer while a group was being added. */
export const MEMBERSHIP_UNAVAILABLE_MESSAGE =
  'Zkuste skupinu přidat za chvíli znovu. Členství teď nelze ověřit.'

/**
 * `14b`, the toast after adding, with the group's name when the service gave one.
 *
 * A group's toast says it was added rather than that its members have access: a Google group can
 * have members outside the domain, who never sign in (`ooltisq0`, worded by the copywriter). An
 * account can only be added on the domain, so its toast can say it has access.
 */
export function addedMessage(kind: AccessKind, email: string, groupName: string | null): string {
  if (kind === 'account') return `${email} má přístup.`
  return groupName === null ? `Přidána skupina ${email}.` : `Přidána skupina „${groupName}“.`
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

/**
 * Checks the proofreaders' address (`14f`). It can be changed, never cleared: without it the
 * digest would quietly stop. It must be on the domain, because the digest carries the articles'
 * names and a typo in the domain would send them out; an account or a group alike, since the app
 * cannot tell them apart and needs not.
 */
export function checkProofreadersAddress(value: string, domain: string): AddressCheck {
  let email = normalizeEmail(value)
  if (email === '') return { message: 'Zadejte adresu korektorů.', ok: false }
  if (!isEmailShaped(email)) return { message: 'Zadejte platnou e-mailovou adresu.', ok: false }
  if (!isOnDomain(email, domain)) {
    return { message: tied`Zadejte adresu na doméně ${domain}.`, ok: false }
  }
  return { email, ok: true }
}

/* `14a`, `14f`, as the copywriter worded them (`tlb36tk0`). The sentences name the access to the
   page _Korektura_ too, which the address decides once proofreaders sign in (#82). */
export const PROOFREADERS_TITLE = 'Korektura'
export const PROOFREADERS_LABEL = 'Adresa korektorů'

export function proofreadersSectionText(domain: string): string {
  return tied`Adresa určuje, kdo má přístup na stránku Korektura. U skupiny Google ho získají jen členové s účtem na doméně ${domain}. Na uvedenou adresu posílá Publikace také ranní přehled.`
}

export const NO_PROOFREADERS_TEXT = tied`Zatím žádná. Přístup přes adresu korektorů není nastavený a ranní přehled neodejde.`
export const PROOFREADERS_ADMIN_ONLY = tied`Adresu mění správci.`
export const PROOFREADERS_FIELD_LABEL = 'Adresa'

export function proofreadersHint(domain: string): string {
  return tied`Zadejte adresu účtu nebo skupiny Google na doméně ${domain}. U skupiny získají přístup jen členové s účtem na této doméně. Přístup se změní do 10 minut. Další přehled odejde na novou adresu.`
}

export const PROOFREADERS_SAVED = tied`Adresa korektorů je uložená.`
