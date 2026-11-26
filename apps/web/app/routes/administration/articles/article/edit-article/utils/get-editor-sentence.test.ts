import { describe, expect, it } from 'vitest'

import { getEditorSentence } from './get-editor-sentence'

describe('getEditorSentence', () => {
  it('says nothing over one’s own text', () => {
    expect(getEditorSentence({ isOwn: true, isSubmitted: true })).toBeNull()
  })

  it('names someone else’s submitted text and the history (24c)', () => {
    expect(getEditorSentence({ isOwn: false, isSubmitted: true })).toBe(
      'Upravujete článek odeslaný ke schválení. Úprava se zapíše do historie pod vaším jménem.',
    )
  })

  it('names someone else’s unsent draft (24c)', () => {
    expect(getEditorSentence({ isOwn: false, isSubmitted: false })).toBe(
      'Upravujete koncept, který není odeslaný ke schválení.',
    )
  })
})
