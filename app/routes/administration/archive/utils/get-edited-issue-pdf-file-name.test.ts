import { describe, expect, test } from 'vitest'

import { getEditedIssuePdfFileName } from './get-edited-issue-pdf-file-name'

const number = { order: 1, supplementSlug: '', year: 2003 }
const stored = {
  ...number,
  pdfFileName: 'VDM_2003_1.pdf',
  state: 'draft' as const,
}

describe('getEditedIssuePdfFileName', () => {
  test('keeps an older name while the number stays', () => {
    expect(getEditedIssuePdfFileName(stored, number)).toBe('VDM_2003_1.pdf')
  })

  test.each([
    [{ ...number, year: 2004 }, 'VDM-2004-1.pdf'],
    [{ ...number, order: 2 }, 'VDM-2003-2.pdf'],
    [{ ...number, supplementSlug: 'ples' }, 'VDM-2003-1-ples.pdf'],
  ])('renames when the number changes to %o', (edited, expected) => {
    expect(getEditedIssuePdfFileName(stored, edited)).toBe(expected)
  })

  test('keeps the name outside a draft', () => {
    expect(
      getEditedIssuePdfFileName(
        { ...stored, state: 'published' },
        { ...number, order: 2 },
      ),
    ).toBe('VDM_2003_1.pdf')
  })

  test.each([[{ ...number, year: null }], [{ ...number, order: null }]])(
    'keeps the stored name without a full number %o',
    (edited) => {
      expect(getEditedIssuePdfFileName(stored, edited)).toBe('VDM_2003_1.pdf')
      expect(
        getEditedIssuePdfFileName({ ...stored, pdfFileName: null }, edited),
      ).toBeNull()
    },
  )

  test('names a PDF the issue did not have', () => {
    expect(
      getEditedIssuePdfFileName({ ...stored, pdfFileName: null }, number),
    ).toBe('VDM-2003-1.pdf')
  })
})
