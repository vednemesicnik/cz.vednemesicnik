import { beforeEach, describe, expect, test, vi } from 'vitest'

const { contentLogDeleteMany } = vi.hoisted(() => ({
  contentLogDeleteMany: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: { contentLog: { deleteMany: contentLogDeleteMany } },
}))

import { deleteContentLog } from './delete-content-log.server'

describe('deleteContentLog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("removes only that content's rows", async () => {
    contentLogDeleteMany.mockResolvedValue({ count: 3 })

    await deleteContentLog({ entity: 'article_tag', entityId: 'tag-1' })

    expect(contentLogDeleteMany).toHaveBeenCalledExactlyOnceWith({
      where: { entity: 'article_tag', entityId: 'tag-1' },
    })
  })

  test('never rejects: a failed delete is only logged', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    contentLogDeleteMany.mockRejectedValue(new Error('database down'))

    await expect(
      deleteContentLog({ entity: 'article', entityId: 'article-1' }),
    ).resolves.toBeUndefined()
    expect(consoleError).toHaveBeenCalled()
  })
})
