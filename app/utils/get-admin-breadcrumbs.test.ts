import { describe, expect, test } from 'vitest'

import { getAdminBreadcrumbs } from './get-admin-breadcrumbs'

const crumb = (label: string, options: { startsTrail?: boolean } = {}) => ({
  handle: {
    breadcrumb: () => ({ label, path: `/${label}` }),
    ...(options.startsTrail ? { breadcrumbStartsTrail: true } : {}),
  },
})

const plain = { handle: undefined }

const labels = (matches: unknown[]) =>
  getAdminBreadcrumbs(matches).map((breadcrumb) => breadcrumb.label)

describe('getAdminBreadcrumbs', () => {
  test('a list has no trail (22a)', () => {
    expect(labels([plain, crumb('Články'), plain])).toEqual([])
  })

  test('a record shows its section and itself (23a)', () => {
    expect(labels([plain, crumb('Články'), crumb('Deset knih')])).toEqual([
      'Články',
      'Deset knih',
    ])
  })

  test('a sub-section starts its own trail (25b)', () => {
    expect(
      labels([
        crumb('Články'),
        crumb('Rubriky', { startsTrail: true }),
        crumb('Kultura'),
      ]),
    ).toEqual(['Rubriky', 'Kultura'])
  })

  test('a sub-section list has no trail (25a)', () => {
    expect(
      labels([crumb('Články'), crumb('Rubriky', { startsTrail: true })]),
    ).toEqual([])
  })

  test('an episode stands under its podcast (27c)', () => {
    expect(labels([crumb('Podcasty'), crumb('Kabinet'), crumb('#11')])).toEqual(
      ['Podcasty', 'Kabinet', '#11'],
    )
  })
})
