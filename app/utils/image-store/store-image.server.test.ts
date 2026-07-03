import { beforeEach, describe, expect, test, vi } from 'vitest'

import { buildImagePrefix } from './image-key'
import { deleteRowWithImages } from './store-image.server'

// Replace the real store with a spy so the store files are never touched; the
// helper (and the `deleteImage` it calls) run for real, so the test also covers
// that the right store prefixes are removed.
const storeDelete = vi.fn(async (_prefixes: string[]) => {})

vi.mock('./image-store.server', () => ({
  imageStore: {
    delete: (prefixes: string[]) => storeDelete(prefixes),
  },
}))

beforeEach(() => {
  storeDelete.mockReset()
  storeDelete.mockImplementation(async () => {})
})

describe('deleteRowWithImages', () => {
  test('loads ids and deletes the row before removing any store files', async () => {
    const order: string[] = []

    const loadImageIds = vi.fn(async () => {
      order.push('load')
      return ['ab123', 'cd456']
    })
    const deleteRow = vi.fn(async () => {
      order.push('delete-row')
      return 'result'
    })
    storeDelete.mockImplementation(async () => {
      order.push('delete-files')
    })

    const result = await deleteRowWithImages(loadImageIds, deleteRow)

    // The DB delete commits before any file is removed (delete files after DB).
    expect(order).toEqual([
      'load',
      'delete-row',
      'delete-files',
      'delete-files',
    ])
    // The helper is transparent to the delete's return value.
    expect(result).toBe('result')
  })

  test('removes the store prefix for each image id', async () => {
    await deleteRowWithImages(
      async () => ['ab123', 'cd456'],
      async () => undefined,
    )

    expect(storeDelete).toHaveBeenCalledTimes(2)
    expect(storeDelete).toHaveBeenCalledWith([buildImagePrefix('ab123')])
    expect(storeDelete).toHaveBeenCalledWith([buildImagePrefix('cd456')])
  })

  test('is a no-op when there are no image ids', async () => {
    const result = await deleteRowWithImages(
      async () => [],
      async () => 'ok',
    )

    expect(result).toBe('ok')
    expect(storeDelete).not.toHaveBeenCalled()
  })

  test('keeps store files when the row delete fails', async () => {
    await expect(
      deleteRowWithImages(
        async () => ['ab123'],
        async () => {
          throw new Error('delete failed')
        },
      ),
    ).rejects.toThrow('delete failed')

    expect(storeDelete).not.toHaveBeenCalled()
  })
})
