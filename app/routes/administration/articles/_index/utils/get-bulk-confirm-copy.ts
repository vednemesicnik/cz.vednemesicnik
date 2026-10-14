import { formatArticleCount } from '~/utils/format-article-count'
import { formatDraftCount } from '~/utils/format-draft-count'

type Options = {
  action: 'archive' | 'delete'
  count: number
  onlyDrafts: boolean
}

/**
 * The texts of the bulk archive and delete confirmations (design 22c): the
 * heading names the verb and the count, the button the same without the
 * question mark.
 *
 * @param options - The action, how many articles it changes, and whether all
 *   of them are drafts (deleting then says koncepty).
 * @returns `title`, `description` and `confirmLabel`.
 */
export const getBulkConfirmCopy = ({ action, count, onlyDrafts }: Options) => {
  if (action === 'archive') {
    const articles = formatArticleCount(count)

    return {
      confirmLabel: `Archivovat ${articles}`,
      description:
        count === 1
          ? 'Čtenáři článek na webu neuvidí. V administraci zůstane mezi archivovanými.'
          : 'Čtenáři články na webu neuvidí. V administraci zůstanou mezi archivovanými.',
      title: `Archivovat ${articles}?`,
    }
  }

  const items = onlyDrafts ? formatDraftCount(count) : formatArticleCount(count)

  return {
    confirmLabel: `Smazat ${items}`,
    description: 'Smazání je nevratné.',
    title: `Smazat ${items}?`,
  }
}
