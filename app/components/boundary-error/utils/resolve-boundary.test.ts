import { describe, expect, test } from 'vitest'

import { createRouteErrorResponse } from '~/components/boundary-error/utils/create-route-error-response'
import {
  resolveAdminBoundary,
  resolveWebsiteBoundary,
} from '~/components/boundary-error/utils/resolve-boundary'

const currentHref = '/current?tab=1'
const notFound = createRouteErrorResponse(404)

describe('resolveWebsiteBoundary', () => {
  test.each([
    [
      'article',
      'Tenhle článek jsme nenašli',
      'Článek nenalezen',
      'Zkontrolujte adresu nebo zkuste jiný článek.',
      ['Všechny články', 'Na úvod'],
    ],
    [
      'category',
      'Tuhle rubriku jsme nenašli',
      'Rubrika nenalezena',
      'Zkontrolujte adresu nebo si vyberte ze všech článků.',
      ['Všechny články'],
    ],
    [
      'tag',
      'Tenhle štítek jsme nenašli',
      'Štítek nenalezen',
      'Zkontrolujte adresu nebo si vyberte ze všech článků.',
      ['Všechny články'],
    ],
    [
      'podcast',
      'Tenhle podcast jsme nenašli',
      'Podcast nenalezen',
      'Zkontrolujte adresu nebo zkuste jiný podcast.',
      ['Všechny podcasty'],
    ],
    [
      'episode',
      'Tuhle epizodu jsme nenašli',
      'Epizoda nenalezena',
      'Zkontrolujte adresu nebo si vyberte z podcastů.',
      ['Všechny podcasty'],
    ],
    [
      'issue',
      'Tohle číslo jsme nenašli',
      'Číslo nenalezeno',
      'Zkontrolujte adresu nebo si vyberte jiné číslo v Archivu.',
      ['Archiv'],
    ],
    [
      null,
      'Tuhle stránku jsme nenašli',
      'Stránka nenalezena',
      'Zkontrolujte adresu nebo pokračujte z úvodu.',
      ['Na úvod'],
    ],
  ] as const)('404 %s', (kind, title, pageTitle, sentence, labels) => {
    const view = resolveWebsiteBoundary(notFound, kind, currentHref)

    expect(view.title).toBe(title)
    expect(view.pageTitle).toBe(pageTitle)
    expect(view.sentence).toBe(sentence)
    expect(view.actions.map((action) => action.label)).toEqual(labels)
    expect(view.unexpected).toBe(false)
  })

  test('404 of an episode of a public podcast offers the podcast', () => {
    const view = resolveWebsiteBoundary(
      createRouteErrorResponse(404, { podcastHref: '/podcasts/some-podcast' }),
      'episode',
      currentHref,
    )

    expect(view.pageTitle).toBe('Epizoda nenalezena')
    expect(view.sentence).toBe(
      'Zkontrolujte adresu nebo si prohlédněte další epizody podcastu.',
    )
    expect(view.actions).toEqual([
      { href: '/podcasts', label: 'Všechny podcasty' },
      { href: '/podcasts/some-podcast', label: 'Na podcast' },
    ])
  })

  test('404 of an unknown address links the sections', () => {
    const view = resolveWebsiteBoundary(notFound, null, currentHref)

    expect(view.links?.map((link) => link.label)).toEqual([
      'Články',
      'Podcasty',
      'Archiv',
    ])
  })

  test.each([
    ['a 403', createRouteErrorResponse(403)],
    ['a 400', createRouteErrorResponse(400, 'Unable to update the author.')],
    ['a 500', createRouteErrorResponse(500)],
    ['an Error', new Error('boom')],
  ])('%s is unexpected', (_label, error) => {
    const view = resolveWebsiteBoundary(error, 'article', currentHref)

    expect(view).toEqual({
      actions: [
        { href: currentHref, label: 'Zkusit znovu', reload: true },
        { href: '/', label: 'Na úvod' },
      ],
      pageTitle: 'Chyba načítání',
      sentence: 'Chyba je na naší straně. Zkuste stránku načíst znovu.',
      title: 'Tady se něco pokazilo',
      unexpected: true,
    })
  })
})

describe('resolveAdminBoundary', () => {
  test.each([
    [
      'article',
      'Článek není k dispozici',
      'Na články',
      '/administration/articles',
    ],
    [
      'category',
      'Rubrika není k dispozici',
      'Na rubriky',
      '/administration/articles/categories',
    ],
    [
      'tag',
      'Štítek není k dispozici',
      'Na štítky',
      '/administration/articles/tags',
    ],
    [
      'issue',
      'Číslo není k dispozici',
      'Do Archivu',
      '/administration/archive',
    ],
    [
      'podcast',
      'Podcast není k dispozici',
      'Na podcasty',
      '/administration/podcasts',
    ],
    ['author', 'Autor není k dispozici', 'Na přehled', '/administration'],
    ['user', 'Uživatel není k dispozici', 'Na přehled', '/administration'],
  ] as const)('404 record %s', (kind, title, label, href) => {
    const view = resolveAdminBoundary(notFound, { kind }, currentHref)

    expect(view).toEqual({
      actions: [{ href, label }],
      highlightsSection: true,
      pageTitle: title,
      sentence: 'Zkontrolujte adresu nebo přejděte na přehled.',
      title,
      unexpected: false,
    })
  })

  test('404 episode leads to its podcast', () => {
    const view = resolveAdminBoundary(
      notFound,
      { kind: 'episode', podcastId: 'p1' },
      currentHref,
    )

    expect(view.title).toBe('Epizoda není k dispozici')
    expect(view.actions).toEqual([
      { href: '/administration/podcasts/p1', label: 'Na podcast' },
    ])
  })

  test('404 of an unknown address', () => {
    expect(resolveAdminBoundary(notFound, null, currentHref)).toEqual({
      actions: [{ href: '/administration', label: 'Na přehled' }],
      highlightsSection: false,
      pageTitle: 'Stránka nenalezena',
      sentence: 'Zkontrolujte adresu nebo pokračujte z přehledu.',
      title: 'Stránka v administraci není',
      unexpected: false,
    })
  })

  test('403 renders the composed reason as sent', () => {
    const actions = [
      { href: '/administration/articles/a1', label: 'Zobrazit článek' },
      { href: '/administration/articles', label: 'Na články' },
    ]
    const view = resolveAdminBoundary(
      createRouteErrorResponse(403, {
        actions,
        cause: 'permission',
        reason:
          'Upravovat lze až po stažení z publikace — článek je publikovaný.',
        title: 'Článek „Kdo píše maturitní otázky“ teď upravit nejde',
      }),
      { kind: 'article' },
      currentHref,
    )

    expect(view).toEqual({
      actions,
      highlightsSection: true,
      sentence:
        'Upravovat lze až po stažení z publikace — článek je publikovaný.',
      title: 'Článek „Kdo píše maturitní otázky“ teď upravit nejde',
      unexpected: false,
    })
  })

  test('403 csrf reloads the page the action started from', () => {
    const view = resolveAdminBoundary(
      createRouteErrorResponse(403, {
        cause: 'csrf',
        href: '/administration/articles/a1',
      }),
      { kind: 'article' },
      currentHref,
    )

    expect(view).toEqual({
      actions: [
        {
          href: '/administration/articles/a1',
          label: 'Načíst znovu',
          reload: true,
        },
      ],
      highlightsSection: true,
      pageTitle: 'Akce se neprovedla',
      sentence: 'Načtěte stránku znovu a akci zopakujte.',
      title: 'Akce se neprovedla',
      unexpected: false,
    })
  })

  test('403 csrf without href reloads the current address', () => {
    const view = resolveAdminBoundary(
      createRouteErrorResponse(403, { cause: 'csrf' }),
      null,
      currentHref,
    )

    expect(view.actions).toEqual([
      { href: currentHref, label: 'Načíst znovu', reload: true },
    ])
  })

  test.each([
    ['a plain string', 'Forbidden'],
    ['an incomplete reason', { cause: 'permission', title: 'X' }],
    ['no data', null],
  ])('403 with %s is the generic denial', (_label, data) => {
    const view = resolveAdminBoundary(
      createRouteErrorResponse(403, data),
      { kind: 'user' },
      currentHref,
    )

    expect(view).toEqual({
      actions: [{ href: '/administration', label: 'Na přehled' }],
      highlightsSection: false,
      pageTitle: 'Akci nelze provést',
      sentence: 'Přejděte na přehled.',
      title: 'Akci nelze provést',
      unexpected: false,
    })
  })

  test.each([
    ['a 400', createRouteErrorResponse(400, 'Unable to update the author.')],
    ['a 429', createRouteErrorResponse(429)],
    ['an Error', new Error('boom')],
    ['a string', 'boom'],
  ])('%s is unexpected', (_label, error) => {
    expect(resolveAdminBoundary(error, null, currentHref)).toEqual({
      actions: [{ href: currentHref, label: 'Zkusit znovu', reload: true }],
      highlightsSection: true,
      pageTitle: 'Chyba načítání',
      sentence: 'Zkuste stránku načíst znovu.',
      title: 'Stránku se nepodařilo načíst',
      unexpected: true,
    })
  })
})
