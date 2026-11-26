import {
  ARTICLE_NOUN,
  CATEGORY_NOUN,
  type CountForms,
  EPISODE_NOUN,
  ISSUE_NOUN,
  PODCAST_NOUN,
  TAG_NOUN,
} from '~/config/list-noun-config'

/** The content the dashboard puts in one queue, in the order 21a names it. */
export const DASHBOARD_TYPES = [
  'article',
  'episode',
  'podcast',
  'issue',
  'category',
  'tag',
] as const

export type DashboardType = (typeof DASHBOARD_TYPES)[number]

type DashboardTypeCopy = {
  label: string
  countForms: CountForms
  approvedOne: string
}

/**
 * What the dashboard says about each type (design 21a; copy thread
 * 2026-09-28-21-prehled-a-30-chybove-stranky): the type over a row's name, its
 * count, and one approved piece by the noun's gender („1 epizoda, schválená“).
 */
export const DASHBOARD_TYPE_COPY: Record<DashboardType, DashboardTypeCopy> = {
  article: {
    approvedOne: 'schválený',
    countForms: ARTICLE_NOUN.countForms,
    label: 'Článek',
  },
  category: {
    approvedOne: 'schválená',
    countForms: CATEGORY_NOUN.countForms,
    label: 'Rubrika',
  },
  episode: {
    approvedOne: 'schválená',
    countForms: EPISODE_NOUN.countForms,
    label: 'Epizoda',
  },
  issue: {
    approvedOne: 'schválené',
    countForms: ISSUE_NOUN.countForms,
    label: 'Číslo',
  },
  podcast: {
    approvedOne: 'schválený',
    countForms: PODCAST_NOUN.countForms,
    label: 'Podcast',
  },
  tag: {
    approvedOne: 'schválený',
    countForms: TAG_NOUN.countForms,
    label: 'Štítek',
  },
}
