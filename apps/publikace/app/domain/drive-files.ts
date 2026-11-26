import { documentUrl } from './article.ts'
import { folderUrl, PRINT_FOLDER_NAME } from './issue.ts'
import { keepOneLetterWords, tied } from './public/typography.ts'
import {
  ARTICLES_LIST,
  ARTWORKS_LIST,
  CLAUSES_LIST,
  REGISTRY_LIST,
  spreadsheetUrl,
} from './record.ts'

/*
 * Nastavení › Soubory na Disku (`14a`, `14j`, copy `i1b02nx7`): where an
 * editor-in-chief finds the app's files and its record outside the app. Every name here is a fixed
 * text: the app asks Drive nothing when the page opens and knows only the IDs of its deployment.
 */

export const DRIVE_FILES_TITLE = 'Soubory na Disku'

/** The article template's name on `publikace.app@`'s own drive, as the file is called there. */
export const ARTICLE_TEMPLATE_NAME = 'TEMPLATE__Publication__Article'

/** The shared drive every new issue lives on. */
const SHARED_DRIVE_NAME = 'Publikace'

const INTRO_START = tied`Na sdíleném disku Publikace vznikají složky a dokumenty nových vydání. Stavy těchto vydání a jejich článků a děl se mění jen v aplikaci.`

/**
 * The intro of the part. Without a Registr it names only the Evidence, since „Aplikace do nich
 * zapisuje“ would claim a write that does not happen (`14j`).
 */
export function driveFilesIntro(hasRegistry: boolean): string {
  return hasRegistry
    ? `${INTRO_START} ${tied`Licence a souhlasy můžete mimo aplikaci dohledat pomocí Registru a Evidence. Aplikace do obou tabulek zapisuje a údaje z nich nepřebírá. Záznamy mohou být opožděné.`}`
    : `${INTRO_START} ${tied`Licence a souhlasy můžete mimo aplikaci dohledat v Evidenci. Aplikace do ní zapisuje a údaje z ní nepřebírá. Záznamy mohou být opožděné.`}`
}

/** A link into Drive, `href` `null` outside production when its ID is not configured. */
export type DriveLink = { href: string | null; text: string }

/**
 * A row's value. `link` is the link with grey text before and after it on one line; `note` is grey
 * text alone; `sentence` stands in the text colour where a value would be (`14j`, as _Zatím
 * žádná._ under Korektura).
 */
export type DriveFileValue =
  | { after: string | null; before: string | null; kind: 'link'; link: DriveLink }
  | { kind: 'note'; text: string }
  | { kind: 'sentence'; text: string }

export type DriveFileRow = {
  /** _jen pro čtení_ at the row's end: the Evidence only, since its whole row is the record. */
  isReadOnly: boolean
  label: string
  value: DriveFileValue
}

export type DriveFileIds = {
  issuesFolderId: string
  /** Empty until the deployment names a Registr; the app then writes none (`14j`). */
  registrySpreadsheetId: string
  templateId: string
}

export const READ_ONLY_TAG = 'jen pro čtení'

function linkTo(id: string, url: (id: string) => string): string | null {
  return id === '' ? null : url(id)
}

/** The five rows of Soubory na Disku, in the order `14a` draws them. */
export function driveFileRows(ids: DriveFileIds): DriveFileRow[] {
  let evidenceLists = [ARTICLES_LIST, CLAUSES_LIST, ARTWORKS_LIST]
    .map((list) => list.name)
    .join(', ')
  return [
    {
      isReadOnly: false,
      label: 'Sdílený disk',
      value: {
        after: null,
        before: `${SHARED_DRIVE_NAME} ·`,
        kind: 'link',
        link: { href: linkTo(ids.issuesFolderId, folderUrl), text: tied`složka s vydáními` },
      },
    },
    {
      isReadOnly: false,
      label: 'Registr vydání',
      /* The sentence, not a tag, carries _jen pro čtení_: a tag at the row's end would read as
         true of the whole Registr, the scripts' hand-edited list Vydání included (`i1b02nx7`). */
      value:
        ids.registrySpreadsheetId === ''
          ? { kind: 'sentence', text: tied`Aplikace do Registru nezapisuje.` }
          : {
              /* The list's name is the app's own text, not one a person typed: tied as well. */
              after: tied`· list ${keepOneLetterWords(REGISTRY_LIST.name)} je jen pro čtení`,
              before: null,
              kind: 'link',
              link: { href: spreadsheetUrl(ids.registrySpreadsheetId), text: 'Registr' },
            },
    },
    {
      isReadOnly: true,
      label: 'Evidence',
      value: { kind: 'note', text: tied`v každé složce vydání · listy ${evidenceLists}` },
    },
    {
      isReadOnly: false,
      label: 'Šablona článku',
      value: {
        after: null,
        before: null,
        kind: 'link',
        link: { href: linkTo(ids.templateId, documentUrl), text: ARTICLE_TEMPLATE_NAME },
      },
    },
    {
      isReadOnly: false,
      label: 'Podklady pro tisk',
      value: { kind: 'note', text: tied`v každé složce vydání › ${PRINT_FOLDER_NAME}` },
    },
  ]
}
