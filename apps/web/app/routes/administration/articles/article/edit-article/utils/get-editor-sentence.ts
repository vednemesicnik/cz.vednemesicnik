type Options = {
  /** The editor is one of the article's authors. */
  isOwn: boolean
  /** The article was sent for approval. */
  isSubmitted: boolean
}

/**
 * The sentence over someone else's text (design 24c): whose it is and that
 * the edit goes into the history under the editor's name. Without gender or
 * number, as there can be several authors (940ikr3o; copy utgh1hb7).
 *
 * @returns The sentence, or `null` over one's own text.
 */
export const getEditorSentence = ({
  isOwn,
  isSubmitted,
}: Options): string | null => {
  if (isOwn) return null

  return isSubmitted
    ? 'Upravujete článek odeslaný ke schválení. Úprava se zapíše do historie pod vaším jménem.'
    : 'Upravujete koncept, který není odeslaný ke schválení.'
}
