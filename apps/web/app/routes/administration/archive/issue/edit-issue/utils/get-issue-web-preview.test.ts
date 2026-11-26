import { describe, expect, test } from 'vitest'

import { getIssueWebPreview } from './get-issue-web-preview'

const issue = {
  isNumberTaken: false,
  name: 'podzim',
  order: 4,
  publishedMainIssueName: null,
  publishedNumber: null,
  storedPdfFileName: null,
  supplement: null,
  year: 2026,
}

describe('getIssueWebPreview', () => {
  test('the title with its order and the provisional address (26j)', () => {
    expect(getIssueWebPreview(issue)).toEqual({
      address: '/archive/VDM-2026-4.pdf · předběžná adresa',
      missingNote: null,
      orderLabel: '4/2026',
      title: 'podzim 2026',
    })
  })

  test('the order alone without a name', () => {
    expect(getIssueWebPreview({ ...issue, name: null })).toMatchObject({
      orderLabel: null,
      title: '4/2026',
    })
  })

  test('a supplement after its published main issue', () => {
    expect(
      getIssueWebPreview({
        ...issue,
        name: null,
        publishedMainIssueName: 'červen',
        supplement: 'Maturitní ples',
      }).title,
    ).toBe('Maturitní ples · doplněk k číslu červen 2026')
  })

  test('keeps the named title without the order', () => {
    expect(getIssueWebPreview({ ...issue, order: null })).toEqual({
      address: null,
      missingNote:
        'Úplný náhled názvu a adresy PDF se zobrazí po doplnění pořadí v roce.',
      orderLabel: null,
      title: 'podzim 2026',
    })
  })

  test('keeps the name alone without the year (26j)', () => {
    expect(getIssueWebPreview({ ...issue, order: null, year: null })).toEqual({
      address: null,
      missingNote:
        'Úplný náhled názvu a adresy PDF se zobrazí po doplnění roku a pořadí v roce.',
      orderLabel: null,
      title: 'podzim',
    })
    expect(
      getIssueWebPreview({ ...issue, name: null, year: null }).title,
    ).toBeNull()
    expect(getIssueWebPreview({ ...issue, year: null }).missingNote).toBe(
      'Úplný náhled názvu a adresy PDF se zobrazí po doplnění roku.',
    )
  })

  test("a supplement's provisional address has its slug", () => {
    expect(
      getIssueWebPreview({ ...issue, supplement: 'Maturitní ples' }).address,
    ).toBe('/archive/VDM-2026-4-maturitni-ples.pdf · předběžná adresa')
  })

  test('says a taken number gets no address (copy d288tkdf)', () => {
    expect(getIssueWebPreview({ ...issue, isNumberTaken: true })).toEqual({
      address: null,
      missingNote: 'Náhled adresy PDF se zobrazí po zadání neobsazeného čísla.',
      orderLabel: '4/2026',
      title: 'podzim 2026',
    })
  })

  test('the address of the number it holds, without the qualifier', () => {
    expect(
      getIssueWebPreview({
        ...issue,
        publishedNumber: '2026-4',
        storedPdfFileName: 'VDM_2026_4.pdf',
      }).address,
    ).toBe('/archive/VDM_2026_4.pdf')
  })

  test('a provisional address again once its number changed', () => {
    expect(
      getIssueWebPreview({
        ...issue,
        order: 5,
        publishedNumber: '2026-4',
        storedPdfFileName: 'VDM-2026-4.pdf',
      }).address,
    ).toBe('/archive/VDM-2026-5.pdf · předběžná adresa')
  })
})
