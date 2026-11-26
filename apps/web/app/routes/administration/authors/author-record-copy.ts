/**
 * The words of Nový autor and Upravit autora (design 28c; copy 9w0473vu C,
 * fzqkfmeg). The toasts follow the categories' „Rubrika vytvořena / uložena“
 * (copy 4wozro76). Deleting an author nothing holds follows 25d (design 28g,
 * h2twqjee, jh9c3a7n; copy 0t7rbimg); in bulk it is `AUTHOR_BULK_NOUN`.
 */
export const AUTHOR_RECORD_COPY = {
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
