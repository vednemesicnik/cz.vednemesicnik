/**
 * The form _Nový článek_: its rules (`20b`), checked the same in the browser and on the server,
 * and its words (`20a`), as the copywriter settled them (il3qqrj9). Under `public/`, so the
 * browser may load it, and free of anything it could not.
 */

import { tied } from './typography.ts'

export const MAX_ARTICLE_NAME_LENGTH = 200
export const MAX_AUTHOR_NAME_LENGTH = 200
export const MAX_AUTHORS = 10

/** What the form sent for one author card. */
export type AuthorInput = { email: string; name: string }

export type ArticleInput = { authors: readonly AuthorInput[]; name: string }

/** An author as the article keeps them: the name is also the signature, as in the script. */
export type Author = { email: string; name: string }

/**
 * Where an error belongs: `name`, a card's `name` or `email` by its 1-based number, or the group
 * of authors. The summary on top lists them in this order (`20b`).
 */
export type FieldKey = 'authors' | 'name' | `author-${number}-email` | `author-${number}-name`

export type FieldError = { key: FieldKey; message: string }

export type ArticleCheck =
  | { article: { authors: Author[]; name: string }; ok: true }
  | { authors: AuthorInput[]; errors: FieldError[]; ok: false }

/* `20b`, as the copywriter settled them (il3qqrj9). */
export const EMPTY_ARTICLE_NAME_MESSAGE = 'Vyplňte název článku.'
export const LONG_ARTICLE_NAME_MESSAGE = 'Zkraťte název na nejvýš 200 znaků.'
export const EMPTY_AUTHOR_NAME_MESSAGE = tied`Vyplňte jméno a příjmení.`
/* Derived from the article name's sentence, not yet through the copywriter. */
export const LONG_AUTHOR_NAME_MESSAGE = 'Zkraťte jméno na nejvýš 200 znaků.'
export const EMPTY_AUTHOR_EMAIL_MESSAGE = 'Vyplňte e-mail autora.'
export const MISSING_AT_MESSAGE = 'Doplňte do e-mailové adresy zavináč.'
export const INVALID_EMAIL_MESSAGE = 'Zadejte e-mail ve tvaru jan.novak@external.test.'
export const AUTHOR_LIMIT_NOTE = 'Článek může mít nejvýš 10 autorů.'

export function duplicateEmailMessage(firstAuthor: number): string {
  return tied`Zkontrolujte adresu. Stejnou má i autor ${firstAuthor}.`
}

/** `Opravte 1 pole`, `Opravte 2 pole`, `Opravte 5 polí`. */
export function summaryTitle(count: number): string {
  return `Opravte ${count} ${count >= 5 || count === 0 ? 'polí' : 'pole'}`
}

/** The script's own shape check: the Mailer refuses what this lets through anyway. */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function emailMessage(email: string): string | null {
  if (email === '') return EMPTY_AUTHOR_EMAIL_MESSAGE
  if (!email.includes('@')) return MISSING_AT_MESSAGE
  if (!EMAIL_SHAPE.test(email) || email.length > 254) return INVALID_EMAIL_MESSAGE
  return null
}

/**
 * The form's rules, the same in the browser and on the server (`20b`).
 *
 * A card left wholly empty is dropped without an error, as the script drops it: an extra card
 * somebody added and did not fill is not a mistake to correct. A card with one of its two fields
 * filled gets the missing one's sentence. At least one author is required, so an empty form keeps
 * its first card and both of its errors. More than ten cannot come from the page, which hides
 * _Přidat autora_ at the tenth; a request with more is refused on the group.
 */
export function checkArticle(input: ArticleInput): ArticleCheck {
  let name = input.name.normalize('NFC').trim()
  let cards = input.authors
    .map((author) => ({
      email: author.email.normalize('NFC').trim(),
      name: author.name.normalize('NFC').trim(),
    }))
    .filter((author) => author.name !== '' || author.email !== '')
  if (cards.length === 0) cards = [{ email: '', name: '' }]

  let errors: FieldError[] = []
  if (name === '') errors.push({ key: 'name', message: EMPTY_ARTICLE_NAME_MESSAGE })
  else if ([...name].length > MAX_ARTICLE_NAME_LENGTH) {
    errors.push({ key: 'name', message: LONG_ARTICLE_NAME_MESSAGE })
  }

  let firstWithEmail = new Map<string, number>()
  cards.forEach((card, index) => {
    let number = index + 1
    if (card.name === '') {
      errors.push({ key: `author-${number}-name`, message: EMPTY_AUTHOR_NAME_MESSAGE })
    } else if ([...card.name].length > MAX_AUTHOR_NAME_LENGTH) {
      errors.push({ key: `author-${number}-name`, message: LONG_AUTHOR_NAME_MESSAGE })
    }
    let message = emailMessage(card.email)
    if (message !== null) {
      errors.push({ key: `author-${number}-email`, message })
      return
    }
    let key = card.email.toLowerCase()
    let first = firstWithEmail.get(key)
    if (first === undefined) firstWithEmail.set(key, number)
    else errors.push({ key: `author-${number}-email`, message: duplicateEmailMessage(first) })
  })

  if (cards.length > MAX_AUTHORS) errors.push({ key: 'authors', message: AUTHOR_LIMIT_NOTE })

  if (errors.length > 0) return { authors: cards, errors, ok: false }
  return { article: { authors: cards, name }, ok: true }
}

/** The label of the field an error points at, for the summary's links (`20b`). */
export function fieldLabel(key: FieldKey): string {
  if (key === 'name') return 'Název článku'
  if (key === 'authors') return 'Autoři'
  let match = /^author-(\d+)-(name|email)$/.exec(key)
  let number = match?.[1] ?? ''
  return match?.[2] === 'email' ? `E-mail autora ${number}` : `Autor ${number}`
}

export const REQUIRED_LEGEND = tied`Pole s hvězdičkou jsou povinná.`
export const ARTICLE_NAME_LABEL = 'Název článku'
export const ARTICLE_NAME_PLACEHOLDER = 'Rozhovor s hostem'
export const AUTHORS_LEGEND = 'Autoři'
export const AUTHORS_HINT = tied`Každého autora po korektuře požádáme e-mailem o souhlas s redakční doložkou. Můžete přidat nejvýš 10 autorů.`
export const AUTHOR_NAME_LABEL = tied`Jméno a příjmení`
export const AUTHOR_NAME_PLACEHOLDER = 'Jan Novák'
export const AUTHOR_EMAIL_LABEL = 'E-mail'
export const AUTHOR_EMAIL_PLACEHOLDER = 'jan.novak@external.test'
export const ADD_AUTHOR_LABEL = 'Přidat autora'
export const REMOVE_AUTHOR_LABEL = 'Odebrat'
export const CONSENT_SENTENCE = tied`Odesláním formuláře souhlasíte se zasíláním e-mailů k tomuto článku na uvedené adresy.`
export const CREATE_ARTICLE_LABEL = 'Vytvořit článek'
export const CREATING_ARTICLE_LABEL = 'Článek se vytváří…'

export function authorCardTitle(number: number): string {
  return `Autor ${number}`
}

export function removeAuthorName(number: number): string {
  return `Odebrat autora ${number}`
}
