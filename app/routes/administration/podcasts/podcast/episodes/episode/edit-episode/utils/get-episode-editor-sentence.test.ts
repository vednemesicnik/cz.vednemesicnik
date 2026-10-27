import { describe, expect, test } from 'vitest'

import { getEpisodeEditorSentence } from './get-episode-editor-sentence'

describe('getEpisodeEditorSentence', () => {
  test('none over one’s own episode', () => {
    expect(getEpisodeEditorSentence({ isOwn: true, isSubmitted: true })).toBe(
      null,
    )
  })

  test('over someone else’s submitted episode', () => {
    expect(getEpisodeEditorSentence({ isOwn: false, isSubmitted: true })).toBe(
      'Upravujete epizodu odeslanou ke schválení. Úprava se zapíše do historie pod vaším jménem.',
    )
  })

  test('over someone else’s draft', () => {
    expect(getEpisodeEditorSentence({ isOwn: false, isSubmitted: false })).toBe(
      'Upravujete koncept, který ještě nebyl odeslán ke schválení.',
    )
  })
})
