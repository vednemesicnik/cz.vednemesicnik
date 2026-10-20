import { describe, expect, test } from 'vitest'

import { getIssueWebPreview } from './get-issue-web-preview'

const issue = {
  name: 'podzim',
  order: 4,
  pdfFileName: 'VDM-2026-4.pdf',
  publishedMainIssueName: null,
  supplement: null,
  year: 2026,
}

describe('getIssueWebPreview', () => {
  test('the title with its order and the address', () => {
    expect(getIssueWebPreview(issue)).toEqual({
      address: '/archive/VDM-2026-4.pdf',
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

  test('shows no address before the issue has a PDF name', () => {
    expect(getIssueWebPreview({ ...issue, pdfFileName: null }).address).toBe(
      null,
    )
  })
})
