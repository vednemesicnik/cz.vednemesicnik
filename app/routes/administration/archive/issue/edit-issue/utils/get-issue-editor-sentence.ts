type Options = {
  /** The editor is the issue's author. */
  isOwn: boolean
  /** The issue was sent for approval. */
  isSubmitted: boolean
}

/**
 * The sentence over someone else's issue in the editor (design 24c, copy
 * ey73zhul): that the edit goes into the history under the editor's name.
 *
 * @returns The sentence, or `null` over one's own issue.
 */
export const getIssueEditorSentence = ({
  isOwn,
  isSubmitted,
}: Options): string | null => {
  if (isOwn) return null

  return isSubmitted
    ? 'Upravujete číslo odeslané ke schválení. Úprava se zapíše do historie pod vaším jménem.'
    : 'Upravujete koncept, který ještě nebyl odeslán ke schválení.'
}
