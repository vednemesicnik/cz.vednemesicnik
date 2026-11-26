import { describe, expect, test } from 'vitest'

import { getRejectedIssueFileSentence } from './get-rejected-issue-file-sentence'

const MEGABYTE = 1024 * 1024

const fileOf = (name: string, type: string, size: number) => {
  const file = new File([], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('getRejectedIssueFileSentence', () => {
  test('lets a PDF within the limit go', () => {
    expect(
      getRejectedIssueFileSentence(
        'pdf',
        fileOf('podzim.pdf', 'application/pdf', 10 * MEGABYTE),
      ),
    ).toBeNull()
  })

  test('a PDF over the limit, with a decimal, and the advice (26d)', () => {
    expect(
      getRejectedIssueFileSentence(
        'pdf',
        fileOf('podzim_tisk.pdf', 'application/pdf', 23.35 * MEGABYTE),
      ),
    ).toBe(
      'Vyberte PDF do 10 MB — podzim_tisk.pdf má 23,4 MB. Zkuste PDF exportovat pro web.',
    )
  })

  test('another type for the PDF', () => {
    expect(
      getRejectedIssueFileSentence(
        'pdf',
        fileOf('podzim.docx', 'application/msword', MEGABYTE),
      ),
    ).toBe('Vyberte PDF — podzim.docx není PDF.')
  })

  test('a cover over the limit, a whole number without the decimal', () => {
    expect(
      getRejectedIssueFileSentence(
        'cover',
        fileOf('obalka.jpg', 'image/jpeg', 8 * MEGABYTE),
      ),
    ).toBe('Vyberte obrázek do 5 MB — obalka.jpg má 8 MB.')
  })

  test('a cover just over the limit never reads as the limit', () => {
    expect(
      getRejectedIssueFileSentence(
        'cover',
        fileOf('obalka.jpg', 'image/jpeg', 5 * MEGABYTE + 1),
      ),
    ).toBe('Vyberte obrázek do 5 MB — obalka.jpg má 5,1 MB.')
  })

  test('another type for the cover', () => {
    expect(
      getRejectedIssueFileSentence(
        'cover',
        fileOf('obalka.pdf', 'application/pdf', MEGABYTE),
      ),
    ).toBe('Vyberte obrázek — obalka.pdf není obrázek.')
  })
})
