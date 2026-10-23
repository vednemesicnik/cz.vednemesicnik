import { CATEGORY_NOUN } from '~/config/list-noun-config'
import { formatBulkDeleteToast } from '~/utils/format-bulk-delete-toast'
import { formatListCount } from '~/utils/format-list-count'

import type { TaxonomyRecordCopy } from '../utils/taxonomy-record-copy'

// „Smazat 1 rubriku“: the accusative differs from the nominative only here.
const ACCUSATIVE_COUNT_FORMS = { ...CATEGORY_NOUN.countForms, one: 'rubriku' }

/**
 * A category's words (design 25a–25d, 25g; copy 3htjei2x, dfsrpeuk, 3vnah8ji,
 * inhy7os8). The
 * header sentences follow the copywriter's conversion of 23d for a record with
 * one author (copy thread 26 archiv čísel, 2 Oct 2026).
 */
export const CATEGORY_RECORD_COPY: TaxonomyRecordCopy = {
  allArticlesLink: (articleCount) =>
    `Všechny články v rubrice (${articleCount})`,
  archiveDescription:
    'Rubrika zmizí z webu i z nabídky v editoru článku. Článkům zůstane přiřazená, ale na webu se u nich nezobrazí.',
  archiveTitle: (name) => `Archivovat rubriku „${name}“?`,
  articlesTitle: 'Články v rubrice',
  bulkDelete: {
    count: (count) => formatListCount(count, ACCUSATIVE_COUNT_FORMS),
    description: ({ count, hasArticles }) => {
      const deleted =
        count === 1 ? 'Rubrika se trvale smaže' : 'Rubriky se trvale smažou'
      const removed = count === 1 ? 'odebere' : 'odeberou'

      return hasArticles
        ? `${deleted} a ${removed} z přiřazených článků. Články se nesmažou.`
        : `${deleted}.`
    },
    toast: (deletedCount) =>
      formatBulkDeleteToast(deletedCount, CATEGORY_NOUN.countForms),
  },
  deleteDescription: (articleCount) =>
    articleCount === 0
      ? 'Rubrika se trvale smaže.'
      : `Rubrika se trvale smaže a odebere ze všech přiřazených článků (${articleCount}). Články se nesmažou.`,
  deleteTitle: (name) => `Smazat rubriku „${name}“?`,
  editTitle: 'Upravit rubriku',
  headerSentences: {
    'not-submitted': 'Rubrika nebyla odeslána ke schválení.',
    'who-approves': 'Schválit může Koordinátor.',
    'who-edits': 'Upravovat mohou autor rubriky a Koordinátor.',
    'who-publishes': 'Publikovat může Koordinátor.',
    'who-restores': 'Obnovit rubriku může Koordinátor.',
  },
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
  takenSlug: 'Zadejte jinou adresu — tato je obsazená.',
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
