import { describe, expect, test } from 'vitest'

import { formatIssueFilesSentence } from './format-issue-files-sentence'
import { UPLOADING_SENTENCE } from './issue-file-sentences'

describe('formatIssueFilesSentence', () => {
  test.each([
    [{ cover: true, pdf: false }, UPLOADING_SENTENCE.cover],
    [{ cover: false, pdf: true }, UPLOADING_SENTENCE.pdf],
    [{ cover: true, pdf: true }, UPLOADING_SENTENCE.both],
  ])('%o names what it should', (files, sentence) => {
    expect(formatIssueFilesSentence(files, UPLOADING_SENTENCE)).toBe(sentence)
  })

  test('names nothing for neither', () => {
    expect(
      formatIssueFilesSentence(
        { cover: false, pdf: false },
        UPLOADING_SENTENCE,
      ),
    ).toBeNull()
  })
})
