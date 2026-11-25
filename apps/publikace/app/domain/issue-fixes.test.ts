import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import {
  binnedFilesCallout,
  canRemove,
  canRename,
  type CalloutPart,
  type FixCallout,
  foreignFilesCallout,
  missingFoldersCallout,
  removeDialogText,
  renameDialogText,
} from './issue-fixes.ts'
import { NBSP } from './public/typography.ts'

const AT = Temporal.Instant.from('2026-11-24T09:00:00Z')

function plain(parts: readonly CalloutPart[]): string {
  return parts
    .map((part) => (typeof part === 'string' ? part : part.text))
    .join('')
    .replaceAll(NBSP, ' ')
}

function links(parts: readonly CalloutPart[]): string[] {
  return parts.flatMap((part) => (typeof part === 'string' ? [] : [part.text]))
}

function shown(callout: FixCallout): { text: string; title: string } {
  return { text: plain(callout.text), title: plain(callout.title) }
}

const named = (name: string) => ({ href: `https://drive.test/${name}`, name })

describe('where the fixes stand (12u)', () => {
  it('renames an active or unfinished issue, never a closed one', () => {
    assert.equal(canRename({ closedAt: null, completedAt: AT }), true)
    assert.equal(canRename({ closedAt: null, completedAt: null }), true)
    assert.equal(canRename({ closedAt: AT, completedAt: AT }), false)
  })

  it('removes an issue only while it holds no article and no group', () => {
    assert.equal(canRemove({ articles: 0, groups: 0 }), true)
    assert.equal(canRemove({ articles: 1, groups: 0 }), false)
    assert.equal(canRemove({ articles: 0, groups: 1 }), false)
  })
})

describe('the rename dialog (12v)', () => {
  it('speaks of the Registr only for a complete issue with one set, never of the Evidence', () => {
    let [withRegistry] = renameDialogText('active', true)
    assert.equal(
      withRegistry.replaceAll(NBSP, ' '),
      'Přejmenuje se i složka vydání na sdíleném disku Publikace. Nový název vydání se v Registru může objevit později.',
    )
    for (let [first] of [renameDialogText('active', false), renameDialogText('unfinished', true)]) {
      assert.equal(
        first.replaceAll(NBSP, ' '),
        'Přejmenuje se i složka vydání na sdíleném disku Publikace.',
      )
    }
    assert.ok(!renameDialogText('active', true).join(' ').includes('Evidenc'))
  })

  it('names one article folder, then two, three, and from four two and the rest', () => {
    assert.deepEqual(shown(missingFoldersCallout([named('A')], [])), {
      text: 'K přejmenování vydání jsou potřeba složky všech článků. Nic se nezměnilo.',
      title: 'Obnovte složku článku „A“ z koše, nebo ji vraťte na sdílený disk Publikace.',
    })
    assert.equal(
      shown(missingFoldersCallout([named('A'), named('B')], [])).title,
      'Obnovte složky článků „A“ a „B“ z koše, nebo je vraťte na sdílený disk Publikace.',
    )
    assert.equal(
      shown(missingFoldersCallout([named('A'), named('B'), named('C')], [])).title,
      'Obnovte složky článků „A“, „B“ a „C“ z koše, nebo je vraťte na sdílený disk Publikace.',
    )
    let four = missingFoldersCallout([named('A'), named('B'), named('C'), named('D')], [])
    assert.equal(
      shown(four).title,
      'Obnovte složky článků „A“, „B“ a 2 dalších z koše, nebo je vraťte na sdílený disk Publikace.',
    )
    assert.deepEqual(links(four.title), ['A', 'B'])
  })

  it('names a group by its kind, with the groups’ own reason', () => {
    assert.deepEqual(shown(missingFoldersCallout([], [named('Ilustrace k textům o volbách')])), {
      text: 'K přejmenování vydání jsou potřeba složky všech skupin obrazových děl. Nic se nezměnilo.',
      title:
        'Obnovte složku skupiny „Ilustrace k textům o volbách“ z koše, nebo ji vraťte na sdílený disk Publikace.',
    })
    assert.equal(
      shown(missingFoldersCallout([], [named('A'), named('B')])).title,
      'Obnovte složky skupin „A“ a „B“ z koše, nebo je vraťte na sdílený disk Publikace.',
    )
  })

  it('names the first article and the first group of both kinds, and points at the detail for more', () => {
    assert.deepEqual(
      shown(missingFoldersCallout([named('A')], [named('Mapa obce k rozhovoru i reportáži')])),
      {
        text: 'K přejmenování vydání jsou potřeba složky všech článků a skupin obrazových děl. Nic se nezměnilo.',
        title:
          'Obnovte složky článku „A“ a skupiny „Mapa obce k rozhovoru i reportáži“ z koše, nebo je vraťte na sdílený disk Publikace.',
      },
    )
    let more = missingFoldersCallout(
      [named('A'), named('B')],
      [named('Mapa obce k rozhovoru i reportáži')],
    )
    assert.equal(
      shown(more).title,
      'Obnovte složky článku „A“ a skupiny „Mapa obce k rozhovoru i reportáži“ z koše, nebo je vraťte na sdílený disk Publikace.',
    )
    assert.equal(
      shown(more).text,
      'Další chybějící složky najdete v detailu vydání. K přejmenování vydání jsou potřeba složky všech článků a skupin obrazových děl. Nic se nezměnilo.',
    )
  })

  it('names every binned file in a sentence up to three, and lists them from four', () => {
    let file = (name: string, kind: 'article' | 'group' = 'article') => ({ ...named(name), kind })
    assert.equal(
      shown(binnedFilesCallout([file('Mapa obce k rozhovoru i reportáži', 'group')])).title,
      'Otevřete soubor pro skupinu „Mapa obce k rozhovoru i reportáži“ a obnovte ho z koše.',
    )
    let two = binnedFilesCallout([
      file('Školní jídelna po roce'),
      file('Mapa obce k rozhovoru i reportáži', 'group'),
    ])
    assert.deepEqual(shown(two), {
      text: 'Nic se nezměnilo.',
      title:
        'Otevřete soubor pro článek „Školní jídelna po roce“ a soubor pro skupinu „Mapa obce k rozhovoru i reportáži“ a obnovte je z koše.',
    })
    assert.deepEqual(links(two.title), [
      'soubor pro článek „Školní jídelna po roce“',
      'soubor pro skupinu „Mapa obce k rozhovoru i reportáži“',
    ])
    assert.ok(!plain(two.title).includes('_meta.json'))

    let four = binnedFilesCallout([
      file('A'),
      file('B'),
      file('C'),
      file('Mapa obce k rozhovoru i reportáži', 'group'),
    ])
    assert.equal(shown(four).title, 'Obnovte soubory z koše.')
    assert.deepEqual(
      four.list?.map((item) => item.text),
      [
        'Soubor pro článek „A“',
        'Soubor pro článek „B“',
        'Soubor pro článek „C“',
        'Soubor pro skupinu „Mapa obce k rozhovoru i reportáži“',
      ],
    )
  })
})

describe('the remove dialog (12w)', () => {
  it('builds the second paragraph from the Registr and the link, independently', () => {
    let text = (...args: Parameters<typeof removeDialogText>) =>
      removeDialogText(...args).map((paragraph) => paragraph.replaceAll(NBSP, ' '))
    assert.deepEqual(text('active', true, false), [
      'Složka vydání se přesune do koše sdíleného disku Publikace i se vším, co v ní je.',
      'Vydání zmizí z přehledu i z Registru a jeho název půjde použít znovu. Odkaz pro redakci přestane platit.',
      'Obnovením složky z koše se vydání do aplikace nevrátí.',
      'Nikomu se nic nepošle.',
    ])
    assert.equal(
      text('active', false, false)[1],
      'Vydání zmizí z přehledu a jeho název půjde použít znovu. Odkaz pro redakci přestane platit.',
    )
    assert.equal(
      text('closed', true, false)[1],
      'Vydání zmizí z přehledu i z Registru a jeho název půjde použít znovu.',
    )
    assert.equal(
      text('unfinished', true, false)[1],
      'Vydání zmizí z přehledu a jeho název půjde použít znovu.',
    )
    assert.equal(
      text('active', true, true)[0],
      'Složka vydání už je v koši sdíleného disku Publikace.',
    )
  })

  it('names the files a person put in, a sentence a folder, three at most', () => {
    let file = (name: string, folderName = 'Články') => ({ ...named(name), folderName })
    assert.equal(
      plain(foreignFilesCallout([file('poznamky-k-vydani.docx')]).text),
      'Ve složce „Články“: poznamky-k-vydani.docx. Vydání zůstalo, jak bylo.',
    )
    assert.equal(
      plain(foreignFilesCallout([file('a.docx'), file('b.pdf', 'VDM_2026_6')]).text),
      'Ve složce „Články“: a.docx. Ve složce „VDM_2026_6“: b.pdf. Vydání zůstalo, jak bylo.',
    )
    let five = foreignFilesCallout(['a', 'b', 'c', 'd', 'e'].map((name) => file(`${name}.docx`)))
    assert.equal(
      plain(five.text),
      'Ve složce „Články“: a.docx, b.docx, c.docx a 2 dalších. Vydání zůstalo, jak bylo.',
    )
    assert.deepEqual(links(five.text), ['a.docx', 'b.docx', 'c.docx'])
  })
})
