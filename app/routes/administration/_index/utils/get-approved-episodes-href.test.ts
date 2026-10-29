import { describe, expect, test } from 'vitest'

import { getApprovedEpisodesHref } from './get-approved-episodes-href'

describe('getApprovedEpisodesHref', () => {
  test('one podcast’s episodes lead to its page with the approved', () => {
    expect(getApprovedEpisodesHref(new Set(['kabinet']))).toBe(
      '/administration/podcasts/kabinet?state=approved',
    )
  })

  test('several podcasts’ episodes lead to the podcast list', () => {
    expect(getApprovedEpisodesHref(new Set(['kabinet', 'sbor']))).toBe(
      '/administration/podcasts',
    )
  })
})
