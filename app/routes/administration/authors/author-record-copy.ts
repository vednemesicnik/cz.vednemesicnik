/**
 * The words of Nový autor and Upravit autora (design 28c; copy 9w0473vu C,
 * fzqkfmeg). The toasts follow the categories' „Rubrika vytvořena / uložena“.
 */
export const AUTHOR_RECORD_COPY = {
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
