import type { ArticleQueue } from '~/config/article-queue-config'

// One sentence per empty state, no button but in Koncepty (design 22e).
const EMPTY_QUEUE_SENTENCES: Record<ArticleQueue, string> = {
  approved: 'Mezi schválenými nejsou žádné články.',
  archived: 'Mezi archivovanými nejsou žádné články.',
  draft: 'V konceptech nejsou žádné články.',
  pending: 'Ke schválení nečekají žádné články.',
  published: 'Mezi publikovanými nejsou žádné články.',
  submitted: 'Mezi odeslanými nejsou žádné články.',
}

type EmptyListOptions = {
  states: ArticleQueue[]
  hasOtherFilters: boolean
}

type EmptyListMessage = {
  title: string
  text: string | null
  action: 'newArticle' | 'clearFilters' | null
}

/**
 * What stands in place of an empty table (design 22e). An empty list offers
 * the first step, an empty state says only that it is empty, an empty result
 * the way back.
 *
 * @param options - The selected `states` (none for Vše) and whether a search
 *   or another filter is set.
 * @returns The `title`, an optional `text` under it and the `action`:
 *   Nový článek (where a new article lands), Zrušit filtry, or none.
 */
export const getEmptyListMessage = ({
  states,
  hasOtherFilters,
}: EmptyListOptions): EmptyListMessage => {
  if (hasOtherFilters) {
    return {
      action: 'clearFilters',
      text: 'Žádný článek neodpovídá nastaveným filtrům.',
      title: 'Nic nenalezeno',
    }
  }

  if (states.length === 0) {
    return {
      action: 'newArticle',
      text: 'Nový článek se uloží jako koncept.',
      title: 'Zatím tu není žádný článek',
    }
  }

  const action = states.includes('draft') ? 'newArticle' : null

  if (states.length === 1) {
    return { action, text: null, title: EMPTY_QUEUE_SENTENCES[states[0]] }
  }

  return {
    action,
    text: null,
    title: 'Ve vybraných stavech nejsou žádné články.',
  }
}
