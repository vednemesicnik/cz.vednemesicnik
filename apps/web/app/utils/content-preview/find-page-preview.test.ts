import { describe, expect, test } from 'vitest'

import { findPagePreview } from './find-page-preview'

describe('findPagePreview', () => {
  test('takes the deepest route that has a preview', () => {
    expect(
      findPagePreview([
        { loaderData: { preview: { kind: 'list' } } },
        { loaderData: { title: 'Podcast' } },
        {
          loaderData: {
            preview: {
              administrationPath: '/administration/articles/1',
              entity: 'article',
              kind: 'item',
            },
          },
        },
      ]),
    ).toEqual({
      administrationPath: '/administration/articles/1',
      entity: 'article',
      kind: 'item',
    })
  })

  test('a deeper route without preview leaves the outer one', () => {
    expect(
      findPagePreview([
        { loaderData: { preview: { kind: 'list' } } },
        { loaderData: undefined },
      ]),
    ).toEqual({ kind: 'list' })
  })

  test('a deeper null preview wins over an outer one', () => {
    expect(
      findPagePreview([
        { loaderData: { preview: { kind: 'list' } } },
        { loaderData: { preview: null } },
      ]),
    ).toBeNull()
  })

  test('no route with a preview means none', () => {
    expect(findPagePreview([{ loaderData: null }])).toBeNull()
  })
})
