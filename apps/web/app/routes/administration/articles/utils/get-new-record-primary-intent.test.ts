import { describe, expect, test } from 'vitest'

import { getNewRecordPrimaryIntent } from './get-new-record-primary-intent'

describe('getNewRecordPrimaryIntent', () => {
  test('the Coordinator publishes', () => {
    expect(getNewRecordPrimaryIntent(1)).toBe('publish')
  })

  test.each([2, 3])('role level %i submits for review', (roleLevel) => {
    expect(getNewRecordPrimaryIntent(roleLevel)).toBe('submit-for-review')
  })
})
