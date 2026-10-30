import { describe, expect, test } from 'vitest'

import { computeDraftsFirstWindow } from './compute-drafts-first-window'

describe('computeDraftsFirstWindow', () => {
  test('without drafts the page is the rest alone', () => {
    expect(
      computeDraftsFirstWindow({ draftCount: 0, skip: 9, take: 9 }),
    ).toEqual({ draftSkip: 0, draftTake: 0, restSkip: 9, restTake: 9 })
  })

  test('the first page starts with the drafts and fills up with the rest', () => {
    expect(
      computeDraftsFirstWindow({ draftCount: 2, skip: 0, take: 9 }),
    ).toEqual({ draftSkip: 0, draftTake: 2, restSkip: 0, restTake: 7 })
  })

  test('the second page continues the rest where the first stopped', () => {
    expect(
      computeDraftsFirstWindow({ draftCount: 2, skip: 9, take: 9 }),
    ).toEqual({ draftSkip: 2, draftTake: 0, restSkip: 7, restTake: 9 })
  })

  test('drafts that spill over a page continue on the next one', () => {
    expect(
      computeDraftsFirstWindow({ draftCount: 12, skip: 9, take: 9 }),
    ).toEqual({ draftSkip: 9, draftTake: 3, restSkip: 0, restTake: 6 })
  })

  test('a page made of drafts alone takes none of the rest', () => {
    expect(
      computeDraftsFirstWindow({ draftCount: 20, skip: 9, take: 9 }),
    ).toEqual({ draftSkip: 9, draftTake: 9, restSkip: 0, restTake: 0 })
  })
})
