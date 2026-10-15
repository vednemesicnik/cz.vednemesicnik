import type { TaxonomyRecordCopy } from '../utils/taxonomy-record-copy'

/** A category's words (design 25a, 25c, 25d; copy 3htjei2x, dfsrpeuk, 3vnah8ji). */
export const CATEGORY_RECORD_COPY: TaxonomyRecordCopy = {
  archiveDescription:
    'Rubrika zmizí z webu i z nabídky v editoru článku. Článkům zůstane přiřazená, ale na webu se u nich nezobrazí.',
  archiveTitle: (name) => `Archivovat rubriku „${name}“?`,
  deleteDescription: (articleCount) =>
    articleCount === 0
      ? 'Rubrika se trvale smaže.'
      : `Rubrika se trvale smaže a odebere ze všech přiřazených článků (${articleCount}). Články se nesmažou.`,
  deleteTitle: (name) => `Smazat rubriku „${name}“?`,
  editTitle: 'Upravit rubriku',
  menuLabel: (name) => `Další akce s rubrikou ${name}`,
  newTitle: 'Nová rubrika',
  publicPath: '/articles/categories',
  republishHint:
    'Po opětovném publikování bude rubrika dostupná na nové adrese. Stará adresa nebude fungovat.',
  retractDescription: (publishedArticleCount) =>
    `Rubrika zmizí z webu a u publikovaných článků (${publishedArticleCount}) se přestane zobrazovat. Vrátí se do konceptu, takže ji půjde upravit a publikovat znovu.`,
  retractTitle: (name) => `Stáhnout rubriku „${name}“ z publikace?`,
  selectLabel: (name) => `Vybrat rubriku ${name}`,
  takenName:
    'Zadejte jiný název — tento už má jiná rubrika. Velikost písmen nerozhoduje.',
  takenSlug: 'Zadejte jinou adresu — tuto už má jiná rubrika.',
  toasts: {
    approved: 'Rubrika schválena',
    approvedAndPublished: 'Rubrika schválena a publikována',
    archived: 'Rubrika archivována',
    created: 'Rubrika vytvořena',
    published: 'Rubrika publikována',
    retracted: 'Rubrika stažena z publikace',
    saved: 'Rubrika uložena',
    submitted: 'Rubrika odeslána ke schválení',
  },
}
