/** A space no line may break at. */
export const NBSP = '\u00a0'

/*
 * A one-letter preposition or conjunction begins a word when it opens the text or follows a
 * space, an opening quote or a bracket. The lookbehind reads the text as given, so in _a v tištěné_
 * both words are tied, and _z. s._ is left alone because a full stop follows the letter.
 */
const ONE_LETTER_WORD = /(?<=^|[\s„(])([aikosuvz]) /giu

/**
 * Keeps _v, s, k, z, o, u, a, i_ on the line with the word after it, as Czech typography does.
 * The e-mails run it over their own sentences, never over a name or a title a person typed: those
 * are put in afterwards, exactly as typed.
 */
export function keepOneLetterWords(text: string): string {
  return text.replace(ONE_LETTER_WORD, `$1${NBSP}`)
}

/*
 * Stands in for each value while the template's own text is tied. It is neither a space nor an
 * opening quote, so a letter right after a value is not read as a word of its own, and no
 * literal in the app contains it.
 */
const VALUE = '\u0000'

/**
 * Ties the template's own one-letter words, as `keepOneLetterWords` does, and puts each value in
 * exactly as given — a name or a title a person typed stays as typed. The app's screens write
 * their Czech through it; a one-letter word right before a value is tied to the value.
 */
export function tied(strings: TemplateStringsArray, ...values: readonly unknown[]): string {
  let parts = keepOneLetterWords(strings.join(VALUE)).split(VALUE)
  return parts.reduce((text, part, index) => text + String(values[index - 1]) + part)
}
