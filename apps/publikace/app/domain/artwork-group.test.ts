import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { consentSubject, discardDialogText, sentLead } from './artwork.ts'
import {
  checkGroup,
  groupCountText,
  groupMeta,
  groupNameKey,
  groupNoteLine,
} from './artwork-group.ts'
import { NBSP } from './public/typography.ts'

function plain(text: string): string {
  return text.replaceAll(NBSP, ' ')
}

describe('checkGroup', () => {
  it('trims both fields and keys the name regardless of case and accent encoding', () => {
    let check = checkGroup(
      { name: '  Mapa obce k rozhovoru i reportáži ', note: ' K rozhovoru i reportáži. ' },
      new Map(),
    )
    assert.deepEqual(check, {
      name: 'Mapa obce k rozhovoru i reportáži',
      nameKey: 'mapa obce k rozhovoru i reportáži',
      note: 'K rozhovoru i reportáži.',
      ok: true,
    })
    /* Decomposed on purpose: an accent typed as a combining mark keys the same as a composed one. */
    assert.equal(
      groupNameKey('MAPA OBCE K ROZHOVORU I REPORTA\u0301Z\u030CI'),
      groupNameKey('mapa obce k rozhovoru i reportáži'),
    )
  })

  it('names the field to mend, with 12e’s words, both at once', () => {
    let check = checkGroup({ name: ' ', note: 'x'.repeat(501) }, new Map())
    assert.deepEqual(check, {
      errors: {
        name: 'Vyplňte název skupiny.',
        note: 'Zkraťte poznámku na nejvýš 500 znaků.',
      },
      ok: false,
    })
    let long = checkGroup({ name: 'x'.repeat(201), note: '' }, new Map())
    assert.equal(long.ok ? null : long.errors.name, 'Zkraťte název na nejvýš 200 znaků.')
    assert.equal(checkGroup({ name: 'x'.repeat(200), note: 'x'.repeat(500) }, new Map()).ok, true)
  })

  it('refuses a name the issue holds, naming the group as it is there', () => {
    let check = checkGroup(
      { name: 'mapa obce k rozhovoru i reportáži', note: '' },
      new Map([['mapa obce k rozhovoru i reportáži', 'Mapa obce k rozhovoru i reportáži']]),
    )
    assert.equal(
      check.ok ? null : plain(check.errors.name ?? ''),
      'Skupina Mapa obce k rozhovoru i reportáži už ve vydání je. Zvolte jiný název.',
    )
  })
})

describe('a group’s words', () => {
  it('counts its artworks after its name (12a)', () => {
    assert.equal(groupCountText(0), '· zatím bez děl')
    assert.equal(groupCountText(1), '· 1 dílo')
    assert.equal(groupCountText(4), '· 4 díla')
    assert.equal(groupCountText(5), '· 5 děl')
  })

  it('writes the note as typed after Pro grafika', () => {
    assert.equal(plain(groupNoteLine('K textům „A“ a „B“.')), 'Pro grafika: K textům „A“ a „B“.')
  })

  it('names the group in the request, the 21c lead and the 12o question, as the copywriter put it', () => {
    let group = { kind: 'group' as const, name: 'Mapa obce k rozhovoru i reportáži' }
    assert.equal(
      consentSubject(group, 'VDM_2026_5', '20261118T134500'),
      'Žádost o potvrzení souhlasu s užitím obrazových děl ze skupiny „Mapa obce k rozhovoru i reportáži“ – VDM_2026_5 [20261118T134500]',
    )
    assert.equal(
      plain(sentLead(1, group)),
      'Ve skupině „Mapa obce k rozhovoru i reportáži“ je nově nahrané 1 dílo.',
    )
    assert.equal(
      plain(sentLead(3, group)),
      'Ve skupině „Mapa obce k rozhovoru i reportáži“ jsou nově nahraná 3 díla.',
    )
    assert.equal(
      plain(sentLead(5, group)),
      'Ve skupině „Mapa obce k rozhovoru i reportáži“ je nově nahraných 5 děl.',
    )
    assert.equal(
      plain(discardDialogText(group, 'klara.simkova@external.test', false).join(' ')),
      'Díla z této dávky i PDF jejich licencí se přesunou do koše sdíleného disku Publikace. Díla z vydání zmizí a další žádost o souhlas k nim už nepůjde poslat. Poskytovateli (klara.simkova@external.test) žádné upozornění neodejde. Skupina „Mapa obce k rozhovoru i reportáži“ zůstane i prázdná. Dokud odkaz platí, lze jím díla nahrát znovu.',
    )
  })
})

describe('groupMeta', () => {
  it('writes the scripts’ shape: an article’s keys without a Doc or authors, and the kind', () => {
    let meta = JSON.parse(
      groupMeta({
        groupFolderId: 'f-group',
        issue: 'VDM_2026_5',
        issueFolderId: 'f-issue',
        name: 'Mapa obce k rozhovoru i reportáži',
        note: 'K rozhovoru i reportáži.',
      }),
    ) as Record<string, unknown>
    assert.deepEqual(meta, {
      articleFolderId: 'f-group',
      articleName: 'Mapa obce k rozhovoru i reportáži',
      issue: 'VDM_2026_5',
      issueFolderId: 'f-issue',
      kind: 'artwork-group',
      note: 'K rozhovoru i reportáži.',
      sheetId: null,
    })
  })
})
