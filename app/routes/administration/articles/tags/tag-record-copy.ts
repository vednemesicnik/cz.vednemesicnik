import type { TaxonomyRecordCopy } from '../utils/taxonomy-record-copy'

/**
 * A tag's words (design 25b, 25d, 25e, 25g; copy 3htjei2x, 69iin4rd, dfsrpeuk,
 * 3vnah8ji, inhy7os8). The header sentences follow the copywriter's conversion of 23d
 * for a record with one author (copy thread 26 archiv čísel, 2 Oct 2026).
 */
export const TAG_RECORD_COPY: TaxonomyRecordCopy = {
  allArticlesLink: (articleCount) =>
    `Všechny články se štítkem (${articleCount})`,
  archiveDescription:
    'Štítek zmizí z webu i z nabídky v editoru článku. Článkům zůstane přiřazený, ale na webu se u nich nezobrazí.',
  archiveTitle: (name) => `Archivovat štítek „${name}“?`,
  articlesTitle: 'Články se štítkem',
  deleteDescription: (articleCount) =>
    articleCount === 0
      ? 'Štítek se trvale smaže.'
      : `Štítek se trvale smaže a odebere ze všech přiřazených článků (${articleCount}). Články se nesmažou.`,
  deleteTitle: (name) => `Smazat štítek „${name}“?`,
  editTitle: 'Upravit štítek',
  headerSentences: {
    'not-submitted': 'Štítek není odeslaný ke schválení.',
    'who-approves': 'Schválit může Koordinátor.',
    'who-edits': 'Upravovat mohou autor štítku a Koordinátor.',
    'who-publishes': 'Publikovat může Koordinátor.',
    'who-restores': 'Obnovit štítek může Koordinátor.',
  },
  menuLabel: (name) => `Další akce se štítkem ${name}`,
  newTitle: 'Nový štítek',
  publicPath: '/articles/tags',
  republishHint:
    'Po opětovném publikování bude štítek dostupný na nové adrese. Stará adresa nebude fungovat.',
  retractDescription: (publishedArticleCount) =>
    `Štítek zmizí z webu a u publikovaných článků (${publishedArticleCount}) se přestane zobrazovat. Vrátí se do konceptu, takže ho půjde upravit a publikovat znovu.`,
  retractTitle: (name) => `Stáhnout štítek „${name}“ z publikace?`,
  selectLabel: (name) => `Vybrat štítek ${name}`,
  takenName:
    'Zadejte jiný název — tento už má jiný štítek. Velikost písmen nerozhoduje.',
  takenSlug: 'Zadejte jinou adresu — tato je obsazená.',
  toasts: {
    approved: 'Štítek schválen',
    approvedAndPublished: 'Štítek schválen a publikován',
    archived: 'Štítek archivován',
    created: 'Štítek vytvořen',
    published: 'Štítek publikován',
    retracted: 'Štítek stažen z publikace',
    saved: 'Štítek uložen',
    submitted: 'Štítek odeslán ke schválení',
  },
}
