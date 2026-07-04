import { beforeEach, describe, expect, test, vi } from 'vitest'

import { buildPdfKey } from './pdf-key'
import {
  deletePdfObject,
  preparePdfReplacement,
  storePdf,
} from './store-pdf.server'

// Replace the real store with spies so no files/objects are touched; the helpers
// run for real, so the tests also cover the keys and ordering they use.
const storePut = vi.fn(
  async (_key: string, _data: Uint8Array, _ct: string) => {},
)
const storeDelete = vi.fn(async (_keys: string[]) => {})

vi.mock('./pdf-store.server', () => ({
  pdfStore: {
    delete: (keys: string[]) => storeDelete(keys),
    put: (key: string, data: Uint8Array, contentType: string) =>
      storePut(key, data, contentType),
  },
}))

// Deterministic id for the replacement object.
vi.mock('@paralleldrive/cuid2', () => ({ createId: () => 'newid' }))

const makePdf = (bytes: number[]) =>
  new File([new Uint8Array(bytes)], 'file.pdf', { type: 'application/pdf' })

beforeEach(() => {
  storePut.mockReset()
  storePut.mockImplementation(async () => {})
  storeDelete.mockReset()
  storeDelete.mockImplementation(async () => {})
})

describe('storePdf', () => {
  test('writes the file bytes under the id key as application/pdf', async () => {
    await storePdf('abc', makePdf([1, 2, 3]))

    expect(storePut).toHaveBeenCalledTimes(1)
    const [key, data, contentType] = storePut.mock.calls[0]
    expect(key).toBe(buildPdfKey('abc'))
    expect(contentType).toBe('application/pdf')
    expect(Array.from(data)).toEqual([1, 2, 3])
  })
})

describe('deletePdfObject', () => {
  test('deletes the single object key for the id', async () => {
    await deletePdfObject('abc')

    expect(storeDelete).toHaveBeenCalledWith([buildPdfKey('abc')])
  })
})

describe('preparePdfReplacement', () => {
  test('without a file: updates only fileName and returns a no-op cleanup', async () => {
    const { data, cleanup } = await preparePdfReplacement({
      file: undefined,
      fileName: 'VDM-2025-1.pdf',
      pdfId: 'old',
    })

    expect(data).toEqual({ fileName: 'VDM-2025-1.pdf' })
    expect(storePut).not.toHaveBeenCalled()

    await cleanup()
    expect(storeDelete).not.toHaveBeenCalled()
  })

  test('with a file: writes the new object before returning, deletes old only on cleanup', async () => {
    const { data, cleanup } = await preparePdfReplacement({
      file: makePdf([9]),
      fileName: 'VDM-2025-1.pdf',
      pdfId: 'old',
    })

    // New object written under the fresh id, before returning data.
    expect(storePut).toHaveBeenCalledTimes(1)
    expect(storePut.mock.calls[0][0]).toBe(buildPdfKey('newid'))
    // Data points the row at the new object.
    expect(data).toEqual({
      contentType: 'application/pdf',
      fileName: 'VDM-2025-1.pdf',
      id: 'newid',
    })
    // The previous object stays until cleanup runs (delete-after-DB).
    expect(storeDelete).not.toHaveBeenCalled()

    await cleanup()
    expect(storeDelete).toHaveBeenCalledWith([buildPdfKey('old')])
  })
})
