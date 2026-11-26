import { describe, expect, test } from 'vitest'

import { parseIssuePdfFileName } from './parse-issue-pdf-file-name'

describe('parseIssuePdfFileName', () => {
  test('reads a main issue', () => {
    expect(parseIssuePdfFileName('VDM-2026-4.pdf')).toEqual({
      order: 4,
      supplementSlug: '',
      year: 2026,
    })
  })

  test('reads a supplement', () => {
    expect(parseIssuePdfFileName('VDM-2026-2-maturitni-ples.pdf')).toEqual({
      order: 2,
      supplementSlug: 'maturitni-ples',
      year: 2026,
    })
  })

  test.each([
    'VDM-2026-04.pdf',
    'VDM-2026-0.pdf',
    'VDM-2026-4-.pdf',
    'VDM-2026-4--ples.pdf',
    'VDM-26-4.pdf',
    'vdm-2026-4.pdf',
    'VDM-2026-4.PDF',
    'nazev.pdf',
  ])('refuses %s, which no number gives', (fileName) => {
    expect(parseIssuePdfFileName(fileName)).toBeNull()
  })
})
