import type { TaxonomyRecordCopy } from '../utils/taxonomy-record-copy'

/** A tag's add and edit words (design 25e; copy 3htjei2x, dfsrpeuk). */
export const TAG_RECORD_COPY: TaxonomyRecordCopy = {
  editTitle: 'Upravit štítek',
  newTitle: 'Nový štítek',
  publicPath: '/articles/tags',
  republishHint:
    'Po opětovném publikování bude štítek dostupný na nové adrese. Stará adresa nebude fungovat.',
  takenName:
    'Zadejte jiný název — tento už má jiný štítek. Velikost písmen nerozhoduje.',
  takenSlug: 'Zadejte jinou adresu — tuto už má jiný štítek.',
  toasts: {
    created: 'Štítek vytvořen',
    published: 'Štítek publikován',
    saved: 'Štítek uložen',
    submitted: 'Štítek odeslán ke schválení',
  },
}
