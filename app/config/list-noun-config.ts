import type { ContentQueue } from '~/config/content-queue-config'

/**
 * What an administration list says about its records (design 22e, 25a–28a;
 * copy 3yexna4p, yzyd9p1l, w59y90od, vyecwbul): the empty card, the Stav
 * queues, the pending count and the default saved filter, in the list's noun.
 */
export type ListNoun = {
  emptyTitle: string
  emptyText: string | null
  queueSentences: Record<ContentQueue, string>
  severalStatesSentence: string
  noResultSentence: string
  countForms: Record<Intl.LDMLPluralRule, string>
  defaultFilterHint: string
}

const DEFAULT_FILTER_CONDITION =
  'pokud odkaz neobsahuje vlastní nastavení seznamu.'

const countForms = (one: string, few: string, other: string) => ({
  few,
  many: other,
  one,
  other,
  two: other,
  zero: other,
})

export const ARTICLE_NOUN: ListNoun = {
  countForms: { ...countForms('článek', 'články', 'článků'), many: 'článku' },
  defaultFilterHint: `Použije se při otevření seznamu článků, ${DEFAULT_FILTER_CONDITION}`,
  emptyText: 'Nový článek se uloží jako koncept.',
  emptyTitle: 'Zatím tu není žádný článek',
  noResultSentence: 'Žádný článek neodpovídá nastaveným filtrům.',
  queueSentences: {
    approved: 'Mezi schválenými nejsou žádné články.',
    archived: 'Mezi archivovanými nejsou žádné články.',
    draft: 'V konceptech nejsou žádné články.',
    pending: 'Ke schválení nečekají žádné články.',
    published: 'Mezi publikovanými nejsou žádné články.',
    submitted: 'Mezi odeslanými nejsou žádné články.',
  },
  severalStatesSentence: 'Ve vybraných stavech nejsou žádné články.',
}

// A new category or tag may be published right away by the Coordinator, so
// the card says nothing about where it lands (vyecwbul).
export const CATEGORY_NOUN: ListNoun = {
  countForms: countForms('rubrika', 'rubriky', 'rubrik'),
  defaultFilterHint: `Použije se při otevření seznamu rubrik, ${DEFAULT_FILTER_CONDITION}`,
  emptyText: null,
  emptyTitle: 'Zatím tu není žádná rubrika',
  noResultSentence: 'Žádná rubrika neodpovídá nastaveným filtrům.',
  queueSentences: {
    approved: 'Mezi schválenými nejsou žádné rubriky.',
    archived: 'Mezi archivovanými nejsou žádné rubriky.',
    draft: 'V konceptech nejsou žádné rubriky.',
    pending: 'Ke schválení nečekají žádné rubriky.',
    published: 'Mezi publikovanými nejsou žádné rubriky.',
    submitted: 'Mezi odeslanými nejsou žádné rubriky.',
  },
  severalStatesSentence: 'Ve vybraných stavech nejsou žádné rubriky.',
}

export const TAG_NOUN: ListNoun = {
  countForms: countForms('štítek', 'štítky', 'štítků'),
  defaultFilterHint: `Použije se při otevření seznamu štítků, ${DEFAULT_FILTER_CONDITION}`,
  emptyText: null,
  emptyTitle: 'Zatím tu není žádný štítek',
  noResultSentence: 'Žádný štítek neodpovídá nastaveným filtrům.',
  queueSentences: {
    approved: 'Mezi schválenými nejsou žádné štítky.',
    archived: 'Mezi archivovanými nejsou žádné štítky.',
    draft: 'V konceptech nejsou žádné štítky.',
    pending: 'Ke schválení nečekají žádné štítky.',
    published: 'Mezi publikovanými nejsou žádné štítky.',
    submitted: 'Mezi odeslanými nejsou žádné štítky.',
  },
  severalStatesSentence: 'Ve vybraných stavech nejsou žádné štítky.',
}

export const ISSUE_NOUN: ListNoun = {
  countForms: countForms('číslo', 'čísla', 'čísel'),
  defaultFilterHint: `Použije se při otevření seznamu čísel, ${DEFAULT_FILTER_CONDITION}`,
  emptyText: 'Nové číslo se uloží jako koncept.',
  emptyTitle: 'Zatím tu není žádné číslo',
  noResultSentence: 'Žádné číslo neodpovídá nastaveným filtrům.',
  queueSentences: {
    approved: 'Mezi schválenými nejsou žádná čísla.',
    archived: 'Mezi archivovanými nejsou žádná čísla.',
    draft: 'V konceptech nejsou žádná čísla.',
    pending: 'Ke schválení nečekají žádná čísla.',
    published: 'Mezi publikovanými nejsou žádná čísla.',
    submitted: 'Mezi odeslanými nejsou žádná čísla.',
  },
  severalStatesSentence: 'Ve vybraných stavech nejsou žádná čísla.',
}

export const PODCAST_NOUN: ListNoun = {
  countForms: countForms('podcast', 'podcasty', 'podcastů'),
  defaultFilterHint: `Použije se při otevření seznamu podcastů, ${DEFAULT_FILTER_CONDITION}`,
  emptyText: 'Nový podcast se uloží jako koncept.',
  emptyTitle: 'Zatím tu není žádný podcast',
  noResultSentence: 'Žádný podcast neodpovídá nastaveným filtrům.',
  queueSentences: {
    approved: 'Mezi schválenými nejsou žádné podcasty.',
    archived: 'Mezi archivovanými nejsou žádné podcasty.',
    draft: 'V konceptech nejsou žádné podcasty.',
    pending: 'Ke schválení nečekají žádné podcasty.',
    published: 'Mezi publikovanými nejsou žádné podcasty.',
    submitted: 'Mezi odeslanými nejsou žádné podcasty.',
  },
  severalStatesSentence: 'Ve vybraných stavech nejsou žádné podcasty.',
}

// The list is one podcast's, the saved filter every podcast's (qv31cp5h).
export const EPISODE_NOUN: ListNoun = {
  countForms: countForms('epizoda', 'epizody', 'epizod'),
  defaultFilterHint: `Použije se při otevření seznamu epizod kteréhokoli podcastu, ${DEFAULT_FILTER_CONDITION}`,
  emptyText: null,
  emptyTitle: 'Podcast zatím nemá žádné epizody.',
  noResultSentence: 'Žádná epizoda neodpovídá nastaveným filtrům.',
  queueSentences: {
    approved: 'Mezi schválenými nejsou žádné epizody.',
    archived: 'Mezi archivovanými nejsou žádné epizody.',
    draft: 'V konceptech nejsou žádné epizody.',
    pending: 'Ke schválení nečekají žádné epizody.',
    published: 'Mezi publikovanými nejsou žádné epizody.',
    submitted: 'Mezi odeslanými nejsou žádné epizody.',
  },
  severalStatesSentence: 'Ve vybraných stavech nejsou žádné epizody.',
}
