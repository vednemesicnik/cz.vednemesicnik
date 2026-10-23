import { describe, expect, test } from 'vitest'

import { getMissingIssueContent } from './get-missing-issue-content'

const COMPLETE = {
  hasCover: true,
  hasPdf: true,
  isNumberTaken: false,
  order: 4,
  supplement: null,
  year: 2026,
}

describe('getMissingIssueContent', () => {
  test('is empty for a complete issue', () => {
    expect(getMissingIssueContent(COMPLETE)).toEqual([])
  })

  test.each([
    [{ year: null }, 'Chybí rok.'],
    [{ order: null }, 'Chybí pořadí v roce.'],
    [{ hasCover: false }, 'Chybí obálka.'],
    [{ hasPdf: false }, 'Chybí PDF.'],
    [{ hasCover: false, hasPdf: false }, 'Chybí obálka a PDF.'],
  ])('names only what is missing (%o)', (change, sentence) => {
    expect(getMissingIssueContent({ ...COMPLETE, ...change })).toEqual([
      sentence,
    ])
  })

  test('names all four in one sentence (26e)', () => {
    expect(
      getMissingIssueContent({
        ...COMPLETE,
        hasCover: false,
        hasPdf: false,
        order: null,
        year: null,
      }),
    ).toEqual(['Chybí rok, pořadí v roce, obálka a PDF.'])
  })

  test('says a taken number on its own', () => {
    expect(
      getMissingIssueContent({ ...COMPLETE, isNumberTaken: true }),
    ).toEqual(['Číslo 4/2026 je obsazené.'])
  })

  test('says it after what is missing, as a sentence of its own', () => {
    expect(
      getMissingIssueContent({
        ...COMPLETE,
        hasCover: false,
        isNumberTaken: true,
      }),
    ).toEqual(['Chybí obálka.', 'Číslo 4/2026 je obsazené.'])
  })

  test("names a supplement's taken name", () => {
    expect(
      getMissingIssueContent({
        ...COMPLETE,
        isNumberTaken: true,
        order: 2,
        supplement: 'Maturitní ples',
      }),
    ).toEqual(['Název „Maturitní ples“ je pro číslo 2/2026 obsazený.'])
  })
})
