import { describe, expect, test } from 'vitest'

import { buildPinnedRowsWhere } from './build-pinned-rows-where'

describe('buildPinnedRowsWhere', () => {
  test('keeps the permission clause beside the ids', () => {
    const permissionWhere = { OR: [{ state: 'published' }, { authorId: 'a' }] }

    expect(buildPinnedRowsWhere(permissionWhere, ['x', 'y'])).toEqual({
      AND: [permissionWhere, { id: { in: ['x', 'y'] } }],
    })
  })
})
