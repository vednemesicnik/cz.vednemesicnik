import { describe, expect, test } from 'vitest'

import { getRejectedFileSentence } from './get-rejected-file-sentence'

const MEGABYTE = 1024 * 1024

const createFile = (name: string, type: string, size: number) => {
  const file = new File(['x'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('getRejectedFileSentence (design 24b)', () => {
  test('lets an image up to 10 MB go', () => {
    expect(
      getRejectedFileSentence(
        createFile('ples.jpg', 'image/jpeg', 10 * MEGABYTE),
      ),
    ).toBeNull()
  })

  test('names a file over the limit and its size', () => {
    expect(
      getRejectedFileSentence(
        createFile('ples.jpg', 'image/jpeg', 13.2 * MEGABYTE),
      ),
    ).toBe('Vyberte obrázek do 10 MB — ples.jpg má 14 MB.')
  })

  test('names a file that is not an image', () => {
    expect(
      getRejectedFileSentence(createFile('osnovy.pdf', 'application/pdf', 1)),
    ).toBe('Vyberte obrázek — osnovy.pdf není obrázek.')
  })
})
