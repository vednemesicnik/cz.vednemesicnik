import type { CountForms } from '~/config/list-noun-config'
import {
  ARTICLE_NOUN,
  CATEGORY_NOUN,
  EPISODE_NOUN,
  ISSUE_NOUN,
  PODCAST_NOUN,
  TAG_NOUN,
} from '~/config/list-noun-config'

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
 * What an action does, said one way when a selected record has related
 * content the action reaches (a category's articles) and another when none
 * has (25g).
 */
export type RelatedSentences = {
  withRelated: NumberSentences
  withoutRelated: NumberSentences
}

/**
 * The content each selected record carries, counted beside its title in the
 * dialog (25g, 27a): „Kultura (18 publikovaných článků)“, no brackets at zero.
 * `listedFor` says which count an action lists: everything it holds (deleting
 * takes it off all of them) or only the published (what readers lose).
 */
export type BulkRelated = {
  countForms: CountForms
  publishedCountForms: CountForms
  listedFor: Partial<
    Record<'retract' | 'archive' | 'delete', 'all' | 'published'>
  >
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
 * - `allHeld`, `allIncomplete` — the bar's sentence in place of its actions;
 *   `null` for content with no edit hold or no completeness check (categories,
 *   tags).
 * - `incomplete`, `pending`, `notSubmitted` — the predicate after the count in
 *   the publish dialog: „1 článek | je neúplný. Přeskočí se.“
 * - `creatorRetract` — the Creator's sentence on retracting: its own paragraph
 *   (22c), or right after the first sentence where `creatorAfterFirstSentence`
 *   (25g, 27a).
 * - `descriptions` — what an action does to the records the dialog counts;
 *   `publish` is `null` where the list publishes in a dialog of its own (the
 *   articles' ordered one).
 * - `deleteInFullInk` — the delete sentence stands in full ink, as 22c draws
 *   „Smazání je nevratné.“; 25g and 26f draw theirs in the description's grey.
 * - `related` — the content counted beside each title, or `null`.
 * - `relatedToast` — the toast's second sentence when a changed record had
 *   published related content (27a, 0farrwua), by action; empty for none.
 */
export type BulkNoun = {
  countForms: CountForms
  objectForms: CountForms
  draftCountForms: CountForms | null
  allHeld: NumberSentences | null
  allIncomplete: NumberSentences | null
  incomplete: PluralSentences | null
  pending: PluralSentences
  notSubmitted: PluralSentences
  creatorRetract: NumberSentences
  creatorAfterFirstSentence: boolean
  descriptions: {
    publish: NumberSentences | null
    archive: NumberSentences | RelatedSentences
    retract: NumberSentences | RelatedSentences
    restore: NumberSentences
    delete: NumberSentences | RelatedSentences
  }
  deleteInFullInk: boolean
  related: BulkRelated | null
  relatedToast: Partial<Record<'retract', NumberSentences>>
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
  creatorAfterFirstSentence: false,
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
  related: null,
  relatedToast: {},
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
  creatorAfterFirstSentence: false,
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
  related: null,
  relatedToast: {},
}

/** „publikovaný článek“ by count, beside a category's or a tag's name (25g, 32a). */
export const PUBLISHED_ARTICLE_COUNT_FORMS: CountForms = {
  few: 'publikované články',
  many: 'publikovaného článku',
  one: 'publikovaný článek',
  other: 'publikovaných článků',
  two: 'publikovaných článků',
  zero: 'publikovaných článků',
}

// Deleting counts every assigned article (25d), retracting and archiving only
// the published, which readers lose (25g, sjbpskpf).
const TAXONOMY_RELATED: BulkRelated = {
  countForms: ARTICLE_NOUN.countForms,
  listedFor: { archive: 'published', delete: 'all', retract: 'published' },
  publishedCountForms: PUBLISHED_ARTICLE_COUNT_FORMS,
}

/**
 * The 22c sentences with rubrika (25g; copy p256liqr, 0farrwua, y0xq33k8;
 * delete inhy7os8). A category has no edit hold and no completeness check.
 */
export const CATEGORY_BULK_NOUN: BulkNoun = {
  allHeld: null,
  allIncomplete: null,
  countForms: CATEGORY_NOUN.countForms,
  creatorAfterFirstSentence: true,
  creatorRetract: {
    many: 'Znovu je publikovat může Koordinátor.',
    one: 'Znovu ji publikovat může Koordinátor.',
  },
  deleteInFullInk: false,
  descriptions: {
    archive: {
      withoutRelated: {
        many: 'Rubriky zmizí z webu i z nabídky v editoru článku.',
        one: 'Rubrika zmizí z webu i z nabídky v editoru článku.',
      },
      withRelated: {
        many: 'Rubriky zmizí z webu i z nabídky v editoru článku. Článkům zůstanou přiřazené, ale na webu se u nich nezobrazí.',
        one: 'Rubrika zmizí z webu i z nabídky v editoru článku. Článkům zůstane přiřazená, ale na webu se u nich nezobrazí.',
      },
    },
    delete: {
      withoutRelated: {
        many: 'Rubriky se trvale smažou.',
        one: 'Rubrika se trvale smaže.',
      },
      withRelated: {
        many: 'Rubriky se trvale smažou a odeberou z přiřazených článků. Články se nesmažou.',
        one: 'Rubrika se trvale smaže a odebere z přiřazených článků. Články se nesmažou.',
      },
    },
    publish: {
      many: 'Rubriky budou na webu.',
      one: 'Rubrika bude na webu.',
    },
    restore: {
      many: 'Rubriky se vrátí do konceptu. Na web se dostanou až novou publikací.',
      one: 'Rubrika se vrátí do konceptu. Na web se dostane až novou publikací.',
    },
    retract: {
      withoutRelated: {
        many: 'Rubriky se vrátí do konceptu. Zmizí z webu i z nabídky v editoru článku.',
        one: 'Rubrika se vrátí do konceptu. Zmizí z webu i z nabídky v editoru článku.',
      },
      withRelated: {
        many: 'Rubriky se vrátí do konceptu. Zmizí z webu i z nabídky v editoru článku. Článkům zůstanou přiřazené, ale na webu se u nich nezobrazí.',
        one: 'Rubrika se vrátí do konceptu. Zmizí z webu i z nabídky v editoru článku. Článkům zůstane přiřazená, ale na webu se u nich nezobrazí.',
      },
    },
  },
  draftCountForms: null,
  incomplete: null,
  notSubmitted: {
    few: 'nejsou odeslané ke schválení.',
    one: 'není odeslaná ke schválení.',
    other: 'není odeslaných ke schválení.',
  },
  objectForms: { ...CATEGORY_NOUN.countForms, one: 'rubriku' },
  pending: {
    few: 'čekají na schválení. Publikováním je schválíte.',
    one: 'čeká na schválení. Publikováním ji schválíte.',
    other: 'čeká na schválení. Publikováním je schválíte.',
  },
  related: TAXONOMY_RELATED,
  relatedToast: {},
}

/**
 * The 22c sentences with štítek (25g; copy p256liqr, 0farrwua, y0xq33k8;
 * delete inhy7os8). „štítek“ is inanimate: the object is the subject.
 */
export const TAG_BULK_NOUN: BulkNoun = {
  allHeld: null,
  allIncomplete: null,
  countForms: TAG_NOUN.countForms,
  creatorAfterFirstSentence: true,
  creatorRetract: {
    many: 'Znovu je publikovat může Koordinátor.',
    one: 'Znovu ho publikovat může Koordinátor.',
  },
  deleteInFullInk: false,
  descriptions: {
    archive: {
      withoutRelated: {
        many: 'Štítky zmizí z webu i z nabídky v editoru článku.',
        one: 'Štítek zmizí z webu i z nabídky v editoru článku.',
      },
      withRelated: {
        many: 'Štítky zmizí z webu i z nabídky v editoru článku. Článkům zůstanou přiřazené, ale na webu se u nich nezobrazí.',
        one: 'Štítek zmizí z webu i z nabídky v editoru článku. Článkům zůstane přiřazený, ale na webu se u nich nezobrazí.',
      },
    },
    delete: {
      withoutRelated: {
        many: 'Štítky se trvale smažou.',
        one: 'Štítek se trvale smaže.',
      },
      withRelated: {
        many: 'Štítky se trvale smažou a odeberou z přiřazených článků. Články se nesmažou.',
        one: 'Štítek se trvale smaže a odebere z přiřazených článků. Články se nesmažou.',
      },
    },
    publish: {
      many: 'Štítky budou na webu.',
      one: 'Štítek bude na webu.',
    },
    restore: {
      many: 'Štítky se vrátí do konceptu. Na web se dostanou až novou publikací.',
      one: 'Štítek se vrátí do konceptu. Na web se dostane až novou publikací.',
    },
    retract: {
      withoutRelated: {
        many: 'Štítky se vrátí do konceptu. Zmizí z webu i z nabídky v editoru článku.',
        one: 'Štítek se vrátí do konceptu. Zmizí z webu i z nabídky v editoru článku.',
      },
      withRelated: {
        many: 'Štítky se vrátí do konceptu. Zmizí z webu i z nabídky v editoru článku. Článkům zůstanou přiřazené, ale na webu se u nich nezobrazí.',
        one: 'Štítek se vrátí do konceptu. Zmizí z webu i z nabídky v editoru článku. Článkům zůstane přiřazený, ale na webu se u nich nezobrazí.',
      },
    },
  },
  draftCountForms: null,
  incomplete: null,
  notSubmitted: {
    few: 'nejsou odeslané ke schválení.',
    one: 'není odeslaný ke schválení.',
    other: 'není odeslaných ke schválení.',
  },
  objectForms: TAG_NOUN.countForms,
  pending: {
    few: 'čekají na schválení. Publikováním je schválíte.',
    one: 'čeká na schválení. Publikováním ho schválíte.',
    other: 'čeká na schválení. Publikováním je schválíte.',
  },
  related: TAXONOMY_RELATED,
  relatedToast: {},
}

/** „publikovaná epizoda“ by count, beside a podcast's title (27a, djni9qbc). */
export const PUBLISHED_EPISODE_COUNT_FORMS: CountForms = {
  few: 'publikované epizody',
  many: 'publikované epizody',
  one: 'publikovaná epizoda',
  other: 'publikovaných epizod',
  two: 'publikovaných epizod',
  zero: 'publikovaných epizod',
}

/**
 * The 22c sentences with podcast (27a; copy p256liqr, 0farrwua; the toast's
 * second sentence 0farrwua G). A podcast with episodes is never deleted in
 * bulk (27f), so its list counts only the published episodes readers lose.
 */
export const PODCAST_BULK_NOUN: BulkNoun = {
  allHeld: {
    many: 'Všechny vybrané podcasty se právě upravují.',
    one: 'Vybraný podcast se právě upravuje.',
  },
  allIncomplete: {
    many: 'Vybrané podcasty nelze publikovat — jsou neúplné.',
    one: 'Vybraný podcast nelze publikovat — je neúplný.',
  },
  countForms: PODCAST_NOUN.countForms,
  creatorAfterFirstSentence: true,
  creatorRetract: {
    many: 'Znovu je publikovat může Koordinátor.',
    one: 'Znovu ho publikovat může Koordinátor.',
  },
  deleteInFullInk: true,
  descriptions: {
    archive: {
      many: 'Podcasty i jejich publikované epizody zmizí z webu. Stav epizod se nezmění. Epizody se znovu zobrazí až po obnovení příslušného podcastu jako konceptu a jeho publikaci.',
      one: 'Podcast i jeho publikované epizody zmizí z webu. Stav epizod se nezmění. Epizody se znovu zobrazí až po obnovení podcastu jako konceptu a jeho publikaci.',
    },
    delete: { many: 'Smazání je nevratné.', one: 'Smazání je nevratné.' },
    publish: {
      many: 'Podcasty budou na webu.',
      one: 'Podcast bude na webu.',
    },
    restore: {
      many: 'Podcasty se vrátí do konceptu. Na web se dostanou až novou publikací.',
      one: 'Podcast se vrátí do konceptu. Na web se dostane až novou publikací.',
    },
    retract: {
      many: 'Podcasty se vrátí do konceptu. Z webu zmizí i jejich publikované epizody. Stav epizod se nezmění. Po nové publikaci příslušného podcastu se jeho publikované epizody znovu zobrazí.',
      one: 'Podcast se vrátí do konceptu. Z webu zmizí i jeho publikované epizody. Stav epizod se nezmění. Po nové publikaci podcastu se jeho publikované epizody znovu zobrazí.',
    },
  },
  draftCountForms: null,
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
  objectForms: PODCAST_NOUN.countForms,
  pending: {
    few: 'čekají na schválení. Publikováním je schválíte.',
    one: 'čeká na schválení. Publikováním ho schválíte.',
    other: 'čeká na schválení. Publikováním je schválíte.',
  },
  related: {
    countForms: EPISODE_NOUN.countForms,
    listedFor: { archive: 'published', retract: 'published' },
    publishedCountForms: PUBLISHED_EPISODE_COUNT_FORMS,
  },
  relatedToast: {
    retract: {
      many: 'Z webu zmizely i jejich publikované epizody.',
      one: 'Z webu zmizely i jeho publikované epizody.',
    },
  },
}
