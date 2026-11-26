import type { ContentQueue } from '~/config/content-queue-config'
import type { ListNoun } from '~/config/list-noun-config'

type ListEmptyMessageOptions = {
  noun: ListNoun
  states: ContentQueue[]
  hasOtherFilters: boolean
}

type ListEmptyMessage = {
  title: string
  text: string | null
  action: 'create' | 'clearFilters' | null
}

/**
 * What stands in place of an empty administration list (design 22e, 26f,
 * 27g). An empty list offers the first step, an empty state says only that it
 * is empty, an empty result the way back.
 *
 * @param options - The list's `noun`, the selected `states` (none for Vše, and
 *   always none on a list without Stav) and whether a search or another filter
 *   is set.
 * @returns The `title`, an optional `text` under it and the `action`: the
 *   list's create button (where a new record lands), Zrušit filtry, or none.
 */
export const getListEmptyMessage = ({
  noun,
  states,
  hasOtherFilters,
}: ListEmptyMessageOptions): ListEmptyMessage => {
  if (hasOtherFilters) {
    return {
      action: 'clearFilters',
      text: noun.noResultSentence,
      title: 'Nic nenalezeno',
    }
  }

  if (states.length === 0) {
    return { action: 'create', text: noun.emptyText, title: noun.emptyTitle }
  }

  const action = states.includes('draft') ? 'create' : null

  if (states.length === 1) {
    return { action, text: null, title: noun.queueSentences[states[0]] }
  }

  return { action, text: null, title: noun.severalStatesSentence }
}
