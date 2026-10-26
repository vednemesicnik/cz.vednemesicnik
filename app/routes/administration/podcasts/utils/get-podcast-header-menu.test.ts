import { describe, expect, test } from 'vitest'

import { getPodcastHeaderMenu } from './get-podcast-header-menu'

describe('getPodcastHeaderMenu', () => {
  test('a published podcast: Historie, retract, archive (27b)', () => {
    expect(getPodcastHeaderMenu(['view-on-web', 'retract', 'archive'])).toEqual(
      ['history', 'retract', 'archive'],
    )
  })

  test("a draft: Upravit is the header's button, not a menu item", () => {
    expect(
      getPodcastHeaderMenu(['edit', 'submit', 'publish', 'delete']),
    ).toEqual(['history', 'submit', 'publish', 'delete'])
  })

  test('Historie stands even when the role may do nothing else (27j)', () => {
    expect(getPodcastHeaderMenu([])).toEqual(['history'])
  })
})
