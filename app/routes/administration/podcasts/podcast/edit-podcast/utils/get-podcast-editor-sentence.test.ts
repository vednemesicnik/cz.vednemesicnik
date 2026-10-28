import { describe, expect, test } from 'vitest'

import { getPodcastEditorSentence } from './get-podcast-editor-sentence'

describe('getPodcastEditorSentence', () => {
  test('nothing over one’s own podcast', () => {
    expect(
      getPodcastEditorSentence({ isOwn: true, isSubmitted: true }),
    ).toBeNull()
  })

  test('someone else’s podcast sent for approval', () => {
    expect(getPodcastEditorSentence({ isOwn: false, isSubmitted: true })).toBe(
      'Upravujete podcast odeslaný ke schválení. Úprava se zapíše do historie pod vaším jménem.',
    )
  })

  test('someone else’s draft not sent, even if it was before (utgh1hb7)', () => {
    expect(getPodcastEditorSentence({ isOwn: false, isSubmitted: false })).toBe(
      'Upravujete koncept, který není odeslaný ke schválení.',
    )
  })
})
