import type { TaxonomyRecordCopy } from '../utils/taxonomy-record-copy'

/** A category's add and edit words (design 25c; copy 3htjei2x, dfsrpeuk). */
export const CATEGORY_RECORD_COPY: TaxonomyRecordCopy = {
  editTitle: 'Upravit rubriku',
  newTitle: 'Nová rubrika',
  publicPath: '/articles/categories',
  republishHint:
    'Po opětovném publikování bude rubrika dostupná na nové adrese. Stará adresa nebude fungovat.',
  takenName:
    'Zadejte jiný název — tento už má jiná rubrika. Velikost písmen nerozhoduje.',
  takenSlug: 'Zadejte jinou adresu — tuto už má jiná rubrika.',
  toasts: {
    created: 'Rubrika vytvořena',
    published: 'Rubrika publikována',
    saved: 'Rubrika uložena',
    submitted: 'Rubrika odeslána ke schválení',
  },
}
