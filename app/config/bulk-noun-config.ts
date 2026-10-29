import type { CountForms } from '~/config/list-noun-config'
import { ARTICLE_NOUN, ISSUE_NOUN } from '~/config/list-noun-config'

/** A sentence by Czech plural rule of its count: `1` · `2–4` · `5+`. */
export type PluralSentences = {
  one: string
  few: string
  other: string
}

/** A sentence about one selected record and about several. */
export type NumberSentences = {
  one: string
  many: string
}

/**
 * What the selection bar, its dialogs and its toast say about a list's records
 * (design 22c, 25g, 26f, 27a, 27b; copy p256liqr, 0farrwua). Each list swaps
 * the noun; the sentences keep one shape across the lists.
 *
 * - `countForms` — the subject: „Publikováno: 1 článek“.
 * - `objectForms` — the object: „Archivovat 1 článek?“, „1 epizodu právě někdo
 *   upravuje.“
 * - `draftCountForms` — deleting only drafts counts koncepty, or `null` when
 *   the list says its own noun.
 * - `allHeld`, `allIncomplete` — the bar's sentence in place of its actions.
 * - `incomplete`, `pending`, `notSubmitted` — the predicate after the count in
 *   the publish dialog: „1 článek | je neúplný. Přeskočí se.“
 * - `creatorRetract` — the Creator's sentence after a retract's first one.
 * - `descriptions` — what an action does to the records the dialog counts;
 *   `publish` is `null` where the list publishes in a dialog of its own (the
 *   articles' ordered one).
 * - `deleteInFullInk` — the delete sentence stands in full ink, as 22c draws
 *   „Smazání je nevratné.“; 26f draws the issues' in the description's grey.
 */
export type BulkNoun = {
  countForms: CountForms
  objectForms: CountForms
  draftCountForms: CountForms | null
  allHeld: NumberSentences
  allIncomplete: NumberSentences
  incomplete: PluralSentences
  pending: PluralSentences
  notSubmitted: PluralSentences
  creatorRetract: NumberSentences
  descriptions: {
    publish: NumberSentences | null
    archive: NumberSentences
    retract: NumberSentences
    restore: NumberSentences
    delete: NumberSentences
  }
  deleteInFullInk: boolean
}

/** „koncept“ by count, for deleting only drafts (22c). */
export const DRAFT_COUNT_FORMS: CountForms = {
  few: 'koncepty',
  many: 'konceptu',
  one: 'koncept',
  other: 'konceptů',
  two: 'konceptů',
  zero: 'konceptů',
}

export const ARTICLE_BULK_NOUN: BulkNoun = {
  allHeld: {
    many: 'Všechny vybrané články se právě upravují.',
    one: 'Vybraný článek se právě upravuje.',
  },
  allIncomplete: {
    many: 'Vybrané články nelze publikovat — jsou neúplné.',
    one: 'Vybraný článek nelze publikovat — je neúplný.',
  },
  countForms: ARTICLE_NOUN.countForms,
  creatorRetract: {
    many: 'Znovu je publikovat může Koordinátor.',
    one: 'Znovu ho publikovat může Koordinátor.',
  },
  deleteInFullInk: true,
  descriptions: {
    archive: {
      many: 'Čtenáři články na webu neuvidí. V administraci zůstanou mezi archivovanými.',
      one: 'Čtenáři článek na webu neuvidí. V administraci zůstane mezi archivovanými.',
    },
    delete: { many: 'Smazání je nevratné.', one: 'Smazání je nevratné.' },
    publish: null,
    restore: {
      many: 'Články se vrátí do konceptu. Na web se dostanou až novou publikací.',
      one: 'Článek se vrátí do konceptu. Na web se dostane až novou publikací.',
    },
    retract: {
      many: 'Články se vrátí do konceptu. Čtenáři je na webu neuvidí.',
      one: 'Článek se vrátí do konceptu. Čtenáři ho na webu neuvidí.',
    },
  },
  draftCountForms: DRAFT_COUNT_FORMS,
  incomplete: {
    few: 'jsou neúplné.',
    one: 'je neúplný.',
    other: 'je neúplných.',
  },
  notSubmitted: {
    few: 'nejsou odeslané ke schválení.',
    one: 'není odeslaný ke schválení.',
    other: 'není odeslaných ke schválení.',
  },
  objectForms: ARTICLE_NOUN.countForms,
  pending: {
    few: 'čekají na schválení. Publikováním je schválíte.',
    one: 'čeká na schválení. Publikováním ho schválíte.',
    other: 'čeká na schválení. Publikováním je schválíte.',
  },
}

/** The 22c sentences with číslo (26f; copy p256liqr, 0farrwua; delete yzyd9p1l). */
export const ISSUE_BULK_NOUN: BulkNoun = {
  allHeld: {
    many: 'Všechna vybraná čísla se právě upravují.',
    one: 'Vybrané číslo se právě upravuje.',
  },
  allIncomplete: {
    many: 'Vybraná čísla nelze publikovat — jsou neúplná.',
    one: 'Vybrané číslo nelze publikovat — je neúplné.',
  },
  countForms: ISSUE_NOUN.countForms,
  creatorRetract: {
    many: 'Znovu je publikovat může Koordinátor.',
    one: 'Znovu ho publikovat může Koordinátor.',
  },
  deleteInFullInk: false,
  descriptions: {
    archive: {
      many: 'Čtenáři čísla na webu neuvidí. V administraci zůstanou mezi archivovanými.',
      one: 'Čtenáři číslo na webu neuvidí. V administraci zůstane mezi archivovanými.',
    },
    // A draft may have neither a cover nor a PDF, so no file is named.
    delete: {
      many: 'Smažou se i jejich nahrané soubory. Vrátit to nejde.',
      one: 'Smažou se i jeho nahrané soubory. Vrátit to nejde.',
    },
    publish: {
      many: 'Čísla budou publikována v archivu na webu.',
      one: 'Číslo bude publikováno v archivu na webu.',
    },
    restore: {
      many: 'Čísla se vrátí do konceptu. Na web se dostanou až novou publikací.',
      one: 'Číslo se vrátí do konceptu. Na web se dostane až novou publikací.',
    },
    retract: {
      many: 'Čísla se vrátí do konceptu. Čtenáři je na webu neuvidí.',
      one: 'Číslo se vrátí do konceptu. Čtenáři ho na webu neuvidí.',
    },
  },
  draftCountForms: null,
  incomplete: {
    few: 'jsou neúplná.',
    one: 'je neúplné.',
    other: 'je neúplných.',
  },
  notSubmitted: {
    few: 'nejsou odeslaná ke schválení.',
    one: 'není odeslané ke schválení.',
    other: 'není odeslaných ke schválení.',
  },
  objectForms: ISSUE_NOUN.countForms,
  pending: {
    few: 'čekají na schválení. Publikováním je schválíte.',
    one: 'čeká na schválení. Publikováním ho schválíte.',
    other: 'čeká na schválení. Publikováním je schválíte.',
  },
}
