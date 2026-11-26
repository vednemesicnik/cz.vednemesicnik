/**
 * The words of Nový uživatel, Upravit uživatele and removing one's own
 * administration (design 28f, 28g; copy 9w0473vu F and G). The toast, the
 * Změnit search and its empty lines come from copy dn09cn6e.
 */
export const USER_RECORD_COPY = {
  administrator: {
    hint: 'Uživatelská role Administrátor.',
    label: 'Spravuje uživatele a autory',
    warning:
      'Po změně získá tento účet oprávnění spravovat uživatele a autory.',
  },
  author: {
    existing: 'Existující autor bez účtu',
    existingRequired: 'Vyberte autora bez účtu.',
    legend: 'Autor',
    new: 'Nový autor',
    noneLeft:
      'Žádný autor bez účtu není k dispozici. Vyberte možnost Nový autor.',
    noneMatching: 'Žádný autor bez účtu neodpovídá hledání.',
    searchLabel: 'Vybrat autora bez účtu',
    searchPlaceholder: 'Vybrat autora',
  },
  editTitle: 'Upravit uživatele',
  emailHint: 'Na tuto adresu přijde pozvánka s odkazem k prvnímu přihlášení.',
  newTitle: 'Nový uživatel',
  removeOwnAdministration: {
    confirm: 'Odebrat správu',
    description:
      'Po uložení ztratíte oprávnění spravovat ostatní uživatele a autory. Vrátit je může jiný Administrátor nebo Vlastník.',
    title: 'Odebrat si správu uživatelů a autorů?',
  },
  roleConflict:
    'Zkontrolujte uživatelskou roli a uložte ji znovu — mezitím se změnila.',
  roleConflictChange: (actorName: string, changedAt: string) =>
    `Změna: ${actorName} · ${changedAt}`,
  toasts: {
    saved: 'Uživatel uložen',
  },
} as const
