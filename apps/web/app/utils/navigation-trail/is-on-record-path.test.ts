import { describe, expect, test } from 'vitest'

import { isOnRecordPath } from './is-on-record-path'

describe('isOnRecordPath', () => {
  test('a page above or below the current one is on its path', () => {
    expect(
      isOnRecordPath('/administration/articles', '/administration/articles/1'),
    ).toBe(true)
    expect(
      isOnRecordPath(
        '/administration/articles/1/edit-article',
        '/administration/articles/1',
      ),
    ).toBe(true)
  })

  test('a sibling record is not', () => {
    expect(isOnRecordPath('/articles/jiny', '/articles/ples')).toBe(false)
    expect(
      isOnRecordPath('/articles/categories/kultura', '/articles/ples'),
    ).toBe(false)
  })
})
