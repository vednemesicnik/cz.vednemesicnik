import { AUTHOR_COUNT_FORMS } from '~/config/list-noun-config'
import { formatBulkDeleteToast } from '~/utils/format-bulk-delete-toast'
import { formatListCount } from '~/utils/format-list-count'

// „Smazat 1 autora / 3 autory“: the accusative differs from the nominative here.
const ACCUSATIVE_COUNT_FORMS = {
  ...AUTHOR_COUNT_FORMS,
  few: 'autory',
  one: 'autora',
}

/**
 * The words of Nový autor and Upravit autora (design 28c; copy 9w0473vu C,
 * fzqkfmeg). The toasts follow the categories' „Rubrika vytvořena / uložena“
 * (copy 4wozro76). Deleting an author nothing holds, one or in bulk, follows
 * 25d and 25g (design 28g, h2twqjee, jh9c3a7n; copy 0t7rbimg).
 */
export const AUTHOR_RECORD_COPY = {
  /** The bulk delete from the list's selection bar (28g). */
  bulkDelete: {
    /** The count in the title and the button, in the accusative. */
    count: (count: number) => formatListCount(count, ACCUSATIVE_COUNT_FORMS),
    /** The sentence, in the singular for one author. */
    description: (count: number) =>
      count === 1 ? 'Autor se trvale smaže.' : 'Autoři se trvale smažou.',
    toast: (deletedCount: number) =>
      formatBulkDeleteToast(deletedCount, AUTHOR_COUNT_FORMS),
  },
  deleteConfirmLabel: 'Smazat autora',
  deleteDescription: 'Autor se trvale smaže.',
  /** The name follows a colon: in the 1st case, „autora Jana“ reads as Jan. */
  deleteTitle: (name: string) => `Smazat autora: ${name}?`,
  editTitle: 'Upravit autora',
  nameHint: 'Tak, jak bude uvedeno u obsahu.',
  newTitle: 'Nový autor',
  roleConflict:
    'Zkontrolujte autorskou roli a uložte ji znovu — mezitím se změnila.',
  roleConflictChange: (actorName: string, changedAt: string) =>
    `Změna: ${actorName} · ${changedAt}`,
  roleLegend: 'Autorská role',
  toasts: {
    created: 'Autor vytvořen',
    saved: 'Autor uložen',
  },
} as const
