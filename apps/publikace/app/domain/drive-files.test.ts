import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { driveFileRows, driveFilesIntro } from './drive-files.ts'
import { NBSP } from './public/typography.ts'

const IDS = {
  issuesFolderId: 'folder-issues-test',
  registrySpreadsheetId: 'sheet-registry-test',
  templateId: 'doc-template-test',
}

function plain(text: string): string {
  return text.replaceAll(NBSP, ' ')
}

describe('Soubory na Disku (14a, 14j)', () => {
  it('lists the five rows in the drawn order, the Evidence alone tagged read-only', () => {
    let rows = driveFileRows(IDS)
    assert.deepEqual(
      rows.map((row) => row.label),
      ['Sdílený disk', 'Registr vydání', 'Evidence', 'Šablona článku', 'Podklady pro tisk'],
    )
    assert.deepEqual(
      rows.map((row) => row.isReadOnly),
      [false, false, true, false, false],
    )
  })

  it('links the issues folder, the Registr and the template by their IDs', () => {
    let [drive, registry, , template] = driveFileRows(IDS)
    assert.deepEqual(drive?.value, {
      after: null,
      before: 'Publikace ·',
      kind: 'link',
      link: {
        href: 'https://drive.google.com/drive/folders/folder-issues-test',
        text: `složka s${NBSP}vydáními`,
      },
    })
    assert.equal(registry?.value.kind, 'link')
    if (registry?.value.kind === 'link') {
      assert.equal(
        registry.value.link.href,
        'https://docs.google.com/spreadsheets/d/sheet-registry-test/edit',
      )
      assert.equal(registry.value.link.text, 'Registr')
      assert.equal(plain(registry.value.after ?? ''), '· list Vydání z aplikace je jen pro čtení')
    }
    assert.deepEqual(template?.value, {
      after: null,
      before: null,
      kind: 'link',
      link: {
        href: 'https://docs.google.com/document/d/doc-template-test/edit',
        text: 'TEMPLATE__Publication__Article',
      },
    })
  })

  it('names the Evidence lists and the print folder from the record and the issue layout', () => {
    let [, , evidence, , print] = driveFileRows(IDS)
    assert.equal(evidence?.value.kind, 'note')
    if (evidence?.value.kind === 'note') {
      assert.equal(
        plain(evidence.value.text),
        'v každé složce vydání · listy Články, Redakční doložky, Obrazová díla',
      )
    }
    if (print?.value.kind === 'note') {
      assert.equal(plain(print.value.text), 'v každé složce vydání › _Podklady_pro_tisk')
    }
  })

  it('says the app writes no Registr when none is configured, with no link', () => {
    let registry = driveFileRows({ ...IDS, registrySpreadsheetId: '' })[1]
    assert.deepEqual(registry?.value, {
      kind: 'sentence',
      text: 'Aplikace do Registru nezapisuje.',
    })
    assert.equal(registry?.isReadOnly, false)
  })

  it('leaves a link out when its ID is not configured, keeping its text', () => {
    let [drive, , , template] = driveFileRows({ ...IDS, issuesFolderId: '', templateId: '' })
    if (drive?.value.kind === 'link') assert.equal(drive.value.link.href, null)
    if (template?.value.kind === 'link') {
      assert.equal(template.value.link.href, null)
      assert.equal(template.value.link.text, 'TEMPLATE__Publication__Article')
    }
  })

  it('names the Registr in the intro only when it is written', () => {
    assert.equal(
      plain(driveFilesIntro(true)),
      'Na sdíleném disku Publikace vznikají složky a dokumenty nových vydání. Stavy těchto vydání a jejich článků a děl se mění jen v aplikaci. Licence a souhlasy můžete mimo aplikaci dohledat pomocí Registru a Evidence. Aplikace do obou tabulek zapisuje a údaje z nich nepřebírá. Záznamy mohou být opožděné.',
    )
    assert.equal(
      plain(driveFilesIntro(false)),
      'Na sdíleném disku Publikace vznikají složky a dokumenty nových vydání. Stavy těchto vydání a jejich článků a děl se mění jen v aplikaci. Licence a souhlasy můžete mimo aplikaci dohledat v Evidenci. Aplikace do ní zapisuje a údaje z ní nepřebírá. Záznamy mohou být opožděné.',
    )
  })
})
