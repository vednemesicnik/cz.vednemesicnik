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
    let check = checkGroup({ name: '  Obálka ', note: ' K obálce. ' }, new Map())
    assert.deepEqual(check, { name: 'Obálka', nameKey: 'obálka', note: 'K obálce.', ok: true })
    assert.equal(groupNameKey('OBÁLKA'), groupNameKey('obálka'))
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
    let check = checkGroup({ name: 'obálka', note: '' }, new Map([['obálka', 'Obálka']]))
    assert.equal(
      check.ok ? null : plain(check.errors.name ?? ''),
      'Skupina Obálka už ve vydání je. Zvolte jiný název.',
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
    let group = { kind: 'group' as const, name: 'Obálka' }
    assert.equal(
      consentSubject(group, 'VDM_2026_5', '20261118T134500'),
      'Žádost o potvrzení souhlasu s užitím obrazových děl ze skupiny „Obálka“ – VDM_2026_5 [20261118T134500]',
    )
    assert.equal(plain(sentLead(1, group)), 'Ve skupině „Obálka“ je nově nahrané 1 dílo.')
    assert.equal(plain(sentLead(3, group)), 'Ve skupině „Obálka“ jsou nově nahraná 3 díla.')
    assert.equal(plain(sentLead(5, group)), 'Ve skupině „Obálka“ je nově nahraných 5 děl.')
    assert.equal(
      plain(discardDialogText(group, 'klara.simkova@external.test')),
      'Díla z této dávky i PDF jejich licencí se přesunou do koše sdíleného disku Publikace. Díla z vydání zmizí a další žádost o souhlas k nim už nepůjde poslat. Poskytovateli (klara.simkova@external.test) žádné upozornění neodejde. Skupina „Obálka“ zůstane i prázdná. Dokud odkaz platí, lze jím díla nahrát znovu.',
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
        name: 'Obálka',
        note: 'K obálce.',
      }),
    ) as Record<string, unknown>
    assert.deepEqual(meta, {
      articleFolderId: 'f-group',
      articleName: 'Obálka',
      issue: 'VDM_2026_5',
      issueFolderId: 'f-issue',
      kind: 'artwork-group',
      note: 'K obálce.',
      sheetId: null,
    })
  })
})
