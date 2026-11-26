type Options = {
  /** The editor is the podcast's author. */
  isOwn: boolean
  /** The podcast was sent for approval. */
  isSubmitted: boolean
}

/**
 * The sentence over someone else's podcast (design 24c; copy utgh1hb7). A
 * draft taken back or returned for edits was sent before, so it is one that
 * is not sent, not one never sent.
 *
 * @param options - Whose podcast it is and whether it waits for approval.
 * @returns „Upravujete podcast odeslaný ke schválení. …“, „Upravujete
 *   koncept, který není odeslaný ke schválení.“, or `null` on one's own.
 */
export const getPodcastEditorSentence = ({
  isOwn,
  isSubmitted,
}: Options): string | null => {
  if (isOwn) return null

  return isSubmitted
    ? 'Upravujete podcast odeslaný ke schválení. Úprava se zapíše do historie pod vaším jménem.'
    : 'Upravujete koncept, který není odeslaný ke schválení.'
}
