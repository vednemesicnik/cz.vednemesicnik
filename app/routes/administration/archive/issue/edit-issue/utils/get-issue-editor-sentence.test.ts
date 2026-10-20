import { describe, expect, test } from 'vitest'

import { getIssueEditorSentence } from './get-issue-editor-sentence'

describe('getIssueEditorSentence', () => {
  test('none over one’s own issue', () => {
    expect(getIssueEditorSentence({ isOwn: true, isSubmitted: true })).toBe(
      null,
    )
  })

  test('over someone else’s submitted issue', () => {
    expect(getIssueEditorSentence({ isOwn: false, isSubmitted: true })).toBe(
      'Upravujete číslo odeslané ke schválení. Úprava se zapíše do historie pod vaším jménem.',
    )
  })

  test('over someone else’s draft', () => {
    expect(getIssueEditorSentence({ isOwn: false, isSubmitted: false })).toBe(
      'Upravujete koncept, který ještě nebyl odeslán ke schválení.',
    )
  })
})
