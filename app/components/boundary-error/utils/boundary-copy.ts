import { href } from 'react-router'

import type { ContentKind } from './content-kind'

// The only place with boundary copy. Every string is quoted from design 30d–30h
// (copy approved in x24ele6l, 6788p8tk, 2g2tvjrw) — do not reword. Website page
// titles aren't drawn; they come from the copywriter (dh5c0tn6).

export type BoundaryAction = {
  label: string
  href: string
  reload?: true
}

export type BoundaryCopy = {
  title: string
  sentence: string
  actions: BoundaryAction[]
  links?: BoundaryAction[]
  /** Document title without the site name; set on the website copy only. */
  pageTitle?: string
}

const websiteActions = {
  allArticles: { href: href('/articles'), label: 'Všechny články' },
  allPodcasts: { href: href('/podcasts'), label: 'Všechny podcasty' },
  archive: { href: href('/archive'), label: 'Archiv' },
  home: { href: href('/'), label: 'Na úvod' },
} satisfies Record<string, BoundaryAction>

type WebsiteNotFoundKind = Exclude<ContentKind, 'author' | 'user' | 'episode'>

const websiteNotFound: Record<WebsiteNotFoundKind, BoundaryCopy> = {
  article: {
    actions: [websiteActions.allArticles, websiteActions.home],
    pageTitle: 'Článek nenalezen',
    sentence: 'Zkontrolujte adresu nebo zkuste jiný článek.',
    title: 'Tenhle článek jsme nenašli',
  },
  category: {
    actions: [websiteActions.allArticles],
    pageTitle: 'Rubrika nenalezena',
    sentence: 'Zkontrolujte adresu nebo si vyberte ze všech článků.',
    title: 'Tuhle rubriku jsme nenašli',
  },
  issue: {
    actions: [websiteActions.archive],
    pageTitle: 'Číslo nenalezeno',
    sentence: 'Zkontrolujte adresu nebo si vyberte jiné číslo v Archivu.',
    title: 'Tohle číslo jsme nenašli',
  },
  podcast: {
    actions: [websiteActions.allPodcasts],
    pageTitle: 'Podcast nenalezen',
    sentence: 'Zkontrolujte adresu nebo zkuste jiný podcast.',
    title: 'Tenhle podcast jsme nenašli',
  },
  tag: {
    actions: [websiteActions.allArticles],
    pageTitle: 'Štítek nenalezen',
    sentence: 'Zkontrolujte adresu nebo si vyberte ze všech článků.',
    title: 'Tenhle štítek jsme nenašli',
  },
}

const websiteNotFoundPage: BoundaryCopy = {
  actions: [websiteActions.home],
  links: [
    { href: href('/articles'), label: 'Články' },
    { href: href('/podcasts'), label: 'Podcasty' },
    { href: href('/archive'), label: 'Archiv' },
  ],
  pageTitle: 'Stránka nenalezena',
  sentence: 'Zkontrolujte adresu nebo pokračujte z úvodu.',
  title: 'Tuhle stránku jsme nenašli',
}

/**
 * Website 404 copy by content kind (design 30f).
 *
 * @param kind - What the visitor was looking for; `null` or an administration-only
 *   kind renders the generic page.
 * @param podcastHref - For an episode, the podcast's address when it is public.
 * @returns The headline, sentence, buttons and links.
 */
export const getWebsiteNotFoundCopy = (
  kind: ContentKind | null,
  podcastHref?: string,
): BoundaryCopy => {
  if (kind === 'episode') {
    return podcastHref === undefined
      ? {
          actions: [websiteActions.allPodcasts],
          pageTitle: 'Epizoda nenalezena',
          sentence: 'Zkontrolujte adresu nebo si vyberte z podcastů.',
          title: 'Tuhle epizodu jsme nenašli',
        }
      : {
          actions: [
            websiteActions.allPodcasts,
            { href: podcastHref, label: 'Na podcast' },
          ],
          pageTitle: 'Epizoda nenalezena',
          sentence:
            'Zkontrolujte adresu nebo si prohlédněte další epizody podcastu.',
          title: 'Tuhle epizodu jsme nenašli',
        }
  }

  if (kind === null || kind === 'author' || kind === 'user') {
    return websiteNotFoundPage
  }

  return websiteNotFound[kind]
}

/**
 * Website copy for an unexpected error (design 30g).
 *
 * @param currentHref - The current address, reloaded by `Zkusit znovu`.
 * @returns The headline, sentence and buttons.
 */
export const getWebsiteUnexpectedCopy = (
  currentHref: string,
): BoundaryCopy => ({
  actions: [
    { href: currentHref, label: 'Zkusit znovu', reload: true },
    websiteActions.home,
  ],
  pageTitle: 'Chyba načítání',
  sentence: 'Chyba je na naší straně. Zkuste stránku načíst znovu.',
  title: 'Tady se něco pokazilo',
})

const adminOverview: BoundaryAction = {
  href: href('/administration'),
  label: 'Na přehled',
}

const adminRecordTypes: Record<ContentKind, string> = {
  article: 'Článek',
  author: 'Autor',
  category: 'Rubrika',
  episode: 'Epizoda',
  issue: 'Číslo',
  podcast: 'Podcast',
  tag: 'Štítek',
  user: 'Uživatel',
}

const getAdminRecordListAction = (
  kind: ContentKind,
  podcastId?: string,
): BoundaryAction => {
  switch (kind) {
    case 'article':
      return { href: href('/administration/articles'), label: 'Na články' }
    case 'category':
      return {
        href: href('/administration/articles/categories'),
        label: 'Na rubriky',
      }
    case 'tag':
      return { href: href('/administration/articles/tags'), label: 'Na štítky' }
    case 'issue':
      return { href: href('/administration/archive'), label: 'Do Archivu' }
    case 'episode':
      if (podcastId !== undefined) {
        return {
          href: href('/administration/podcasts/:podcastId', { podcastId }),
          label: 'Na podcast',
        }
      }
      return { href: href('/administration/podcasts'), label: 'Na podcasty' }
    case 'podcast':
      return { href: href('/administration/podcasts'), label: 'Na podcasty' }
    case 'author':
    case 'user':
      return adminOverview
  }
}

/**
 * Administration 404 copy for a record that is deleted or not visible to the user
 * (design 30e). The copy is the same for both, so it never claims the record doesn't exist.
 *
 * @param kind - The record kind.
 * @param podcastId - For an episode, the parent podcast's id.
 * @returns The headline, sentence and button.
 */
export const getAdminRecordNotFoundCopy = (
  kind: ContentKind,
  podcastId?: string,
): BoundaryCopy => ({
  actions: [getAdminRecordListAction(kind, podcastId)],
  sentence: 'Zkontrolujte adresu nebo přejděte na přehled.',
  title: `${adminRecordTypes[kind]} není k dispozici`,
})

/** Administration 404 for an address that doesn't exist (design 30e). */
export const adminUnknownAddressCopy: BoundaryCopy = {
  actions: [adminOverview],
  sentence: 'Zkontrolujte adresu nebo pokračujte z přehledu.',
  title: 'Stránka v administraci není',
}

/**
 * Administration 403 for an invalid form token on an action without its own form
 * (design 30h).
 *
 * @param returnHref - The page the action was started from, reloaded by `Načíst znovu`.
 * @returns The headline, sentence and button.
 */
export const getAdminCsrfCopy = (returnHref: string): BoundaryCopy => ({
  actions: [{ href: returnHref, label: 'Načíst znovu', reload: true }],
  sentence: 'Načtěte stránku znovu a akci zopakujte.',
  title: 'Akce se neprovedla',
})

/** Administration 403 without a composed reason (design 30h). */
export const adminGenericForbiddenCopy: BoundaryCopy = {
  actions: [adminOverview],
  sentence: 'Přejděte na přehled.',
  title: 'Akci nelze provést',
}

/**
 * Copy for an unexpected error in the administration and at the root (design 30g).
 *
 * @param currentHref - The current address, reloaded by `Zkusit znovu`.
 * @returns The headline, sentence and button.
 */
export const getPageLoadFailedCopy = (currentHref: string): BoundaryCopy => ({
  actions: [{ href: currentHref, label: 'Zkusit znovu', reload: true }],
  sentence: 'Zkuste stránku načíst znovu.',
  title: 'Stránku se nepodařilo načíst',
})
