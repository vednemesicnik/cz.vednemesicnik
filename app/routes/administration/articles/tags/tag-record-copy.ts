import type { TaxonomyRecordCopy } from '../utils/taxonomy-record-copy'

/** A tag's words (design 25d, 25e; copy 3htjei2x, 69iin4rd, dfsrpeuk). */
export const TAG_RECORD_COPY: TaxonomyRecordCopy = {
  archiveDescription:
    'Štítek zmizí z webu i z nabídky v editoru článku. Článkům zůstane přiřazený, ale na webu se u nich nezobrazí.',
  archiveTitle: (name) => `Archivovat štítek „${name}“?`,
  deleteDescription: (articleCount) =>
    articleCount === 0
      ? 'Štítek se trvale smaže.'
      : `Štítek se trvale smaže a odebere ze všech přiřazených článků (${articleCount}). Články se nesmažou.`,
  deleteTitle: (name) => `Smazat štítek „${name}“?`,
  editTitle: 'Upravit štítek',
  menuLabel: (name) => `Další akce se štítkem ${name}`,
  newTitle: 'Nový štítek',
  publicPath: '/articles/tags',
  republishHint:
    'Po opětovném publikování bude štítek dostupný na nové adrese. Stará adresa nebude fungovat.',
  selectLabel: (name) => `Vybrat štítek ${name}`,
  takenName:
    'Zadejte jiný název — tento už má jiný štítek. Velikost písmen nerozhoduje.',
  takenSlug: 'Zadejte jinou adresu — tuto už má jiný štítek.',
  toasts: {
    approved: 'Štítek schválen',
    archived: 'Štítek archivován',
    created: 'Štítek vytvořen',
    published: 'Štítek publikován',
    saved: 'Štítek uložen',
    submitted: 'Štítek odeslán ke schválení',
  },
}
