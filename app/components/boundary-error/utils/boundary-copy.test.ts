import { describe, expect, test } from 'vitest'

import { getAdminEditDeniedData } from './boundary-copy'

describe('getAdminEditDeniedData', () => {
  test.each([
    ['article', 'Článek', 'článek je publikovaný', 'Zobrazit článek'],
    ['podcast', 'Podcast', 'podcast je publikovaný', 'Zobrazit podcast'],
    ['tag', 'Štítek', 'štítek je publikovaný', 'Zobrazit štítek'],
    ['issue', 'Číslo', 'číslo je publikované', 'Zobrazit číslo'],
    ['episode', 'Epizoda', 'epizoda je publikovaná', 'Zobrazit epizodu'],
    ['category', 'Rubrika', 'rubrika je publikovaná', 'Zobrazit rubriku'],
  ] as const)('published %s takes its gender', (kind, type, state, label) => {
    const forbidden = getAdminEditDeniedData({
      kind,
      podcastId: 'p1',
      reason: 'published',
      recordHref: '/administration/x',
      title: 'Kdo píše maturitní otázky',
    })

    expect(forbidden).toMatchObject({
      cause: 'permission',
      pageTitle: 'Úprava není dostupná',
      reason: `Upravovat lze až po stažení z publikace — ${state}.`,
      title: `${type} „Kdo píše maturitní otázky“ teď upravit nejde`,
    })
    expect(forbidden.cause === 'permission' && forbidden.actions[0]).toEqual({
      href: '/administration/x',
      label,
    })
  })

  test('someone else’s draft', () => {
    expect(
      getAdminEditDeniedData({
        kind: 'article',
        reason: 'foreign-draft',
        recordHref: '/administration/articles/a1',
        title: 'Anketa',
      }),
    ).toEqual({
      actions: [
        { href: '/administration/articles/a1', label: 'Zobrazit článek' },
        { href: '/administration/articles', label: 'Na články' },
      ],
      cause: 'permission',
      pageTitle: 'Úprava není dostupná',
      reason:
        'Úpravy může provést autor nebo Koordinátor — jde o koncept jiného autora.',
      title: 'Článek „Anketa“ upravit nemůžete',
    })
  })

  test('without the right to view, only the way back', () => {
    const forbidden = getAdminEditDeniedData({
      kind: 'episode',
      podcastId: 'p1',
      reason: 'published',
      title: 'Díl 1',
    })

    expect(forbidden.cause === 'permission' && forbidden.actions).toEqual([
      { href: '/administration/podcasts/p1', label: 'Na podcast' },
    ])
  })
})
