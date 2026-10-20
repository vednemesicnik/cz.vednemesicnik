import { describe, expect, test } from 'vitest'

import { getMissingIssueContent } from './get-missing-issue-content'

const COMPLETE = {
  hasCover: true,
  order: 4,
  pdf: { fileName: 'VDM-2026-4.pdf' },
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
    [{ pdf: null }, 'Chybí PDF.'],
    [{ hasCover: false, pdf: null }, 'Chybí obálka a\u00a0PDF.'],
  ])('names only what is missing (%o)', (change, sentence) => {
    expect(getMissingIssueContent({ ...COMPLETE, ...change })).toEqual([
      sentence,
    ])
  })

  test('names all four in one sentence (26e)', () => {
    expect(
      getMissingIssueContent({
        hasCover: false,
        order: null,
        pdf: null,
        year: null,
      }),
    ).toEqual(['Chybí rok, pořadí v roce, obálka a\u00a0PDF.'])
  })

  test('says another issue uses the address of a nameless PDF', () => {
    expect(
      getMissingIssueContent({ ...COMPLETE, pdf: { fileName: null } }),
    ).toEqual(['Adresu PDF už používá jiné číslo.'])
  })

  test('says it after the missing cover', () => {
    expect(
      getMissingIssueContent({
        ...COMPLETE,
        hasCover: false,
        pdf: { fileName: null },
      }),
    ).toEqual(['Chybí obálka a\u00a0adresu PDF už používá jiné číslo.'])
  })

  test('leaves a nameless PDF to the missing year', () => {
    expect(
      getMissingIssueContent({
        ...COMPLETE,
        pdf: { fileName: null },
        year: null,
      }),
    ).toEqual(['Chybí rok.'])
  })
})
