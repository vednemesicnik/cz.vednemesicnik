type Options = {
  /** The editor is the episode's author. */
  isOwn: boolean
  /** The episode was sent for approval. */
  isSubmitted: boolean
}

/**
 * The sentence over someone else's episode in the editor (design 24c, copy
 * ahizoh4o): that the edit goes into the history under the editor's name.
 *
 * @returns The sentence, or `null` over one's own episode.
 */
export const getEpisodeEditorSentence = ({
  isOwn,
  isSubmitted,
}: Options): string | null => {
  if (isOwn) return null

  return isSubmitted
    ? 'Upravujete epizodu odeslanou ke schválení. Úprava se zapíše do historie pod vaším jménem.'
    : 'Upravujete koncept, který ještě nebyl odeslán ke schválení.'
}
