import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { articleStateTag } from './article.ts'
import { decideProofreading, type DocMenuDialog, type ProofreadingTarget } from './doc-menu.ts'

const AT = Temporal.Instant.from('2026-11-19T09:12:00Z')
const JAKUB = { email: 'jakub.novak@vednemesicnik.test', name: 'Jakub Novák' }
const ARTICLE: ProofreadingTarget = {
  articleName: 'Volební kampaň na sítích',
  isIssueClosed: false,
  issueName: 'VDM_2026_5',
  kind: 'article',
  proofreading: null,
}

function asDialog(answer: ReturnType<typeof decideProofreading>): DocMenuDialog {
  if (!('heading' in answer)) throw new Error('Expected a dialog.')
  return answer
}

function texts(dialog: DocMenuDialog): string[] {
  return dialog.lines.map((line) => line.text)
}

describe('the Doc menu’s answer to Označit probíhající korekturu', () => {
  it('asks first, with the article, its issue and the account it will record', () => {
    let dialog = asDialog(
      decideProofreading({ account: JAKUB, isConfirmed: false, target: ARTICLE }),
    )

    assert.equal(dialog.heading, 'Označit probíhající korekturu?')
    assert.equal(dialog.title, '„Volební kampaň na sítích“')
    assert.equal(dialog.meta, 'VDM_2026_5 · Ke korektuře zatím nepředáno')
    assert.deepEqual(dialog.lines, [
      { text: 'Šéfredakce v Publikaci uvidí, kdo dělá korekturu.', tone: 'body' },
      { text: 'Účet pro korekturu: Jakub Novák', tone: 'strong' },
      {
        text: 'Po označení už článek nepůjde předat ke korektuře a korektorům neodejde e-mail.',
        tone: 'warning',
      },
      { text: 'Označení nelze vzít zpět.', tone: 'body' },
    ])
    assert.deepEqual(dialog.actions, [
      { kind: 'close', label: 'Zrušit' },
      { kind: 'confirm', label: 'Označit', pendingLabel: 'Označování…' },
    ])
  })

  it('shows the address where Google gave no name', () => {
    let dialog = asDialog(
      decideProofreading({
        account: { email: 'jakub.novak.korektury@external.test', name: null },
        isConfirmed: false,
        target: ARTICLE,
      }),
    )
    assert.ok(texts(dialog).includes('Účet pro korekturu: jakub.novak.korektury@external.test'))
  })

  it('records only once the click confirms', () => {
    assert.deepEqual(decideProofreading({ account: JAKUB, isConfirmed: true, target: ARTICLE }), {
      kind: 'record',
    })
  })

  it('tells a second click who marked it and when, and writes nothing', () => {
    let target = { ...ARTICLE, proofreading: { at: AT, ...JAKUB } }
    for (let isConfirmed of [false, true]) {
      let dialog = asDialog(decideProofreading({ account: JAKUB, isConfirmed, target }))
      assert.equal(dialog.heading, 'Korektura už je označená')
      assert.deepEqual(texts(dialog), [
        'Označeno 19. 11. v 10:12 · Jakub Novák',
        'Nic se nezměnilo.',
      ])
    }
  })

  it('refuses a closed issue before looking at the article', () => {
    let target = { ...ARTICLE, isIssueClosed: true, proofreading: { at: AT, ...JAKUB } }
    let dialog = asDialog(decideProofreading({ account: JAKUB, isConfirmed: true, target }))
    assert.equal(dialog.heading, 'Vydání VDM_2026_5 je uzavřené')
    assert.deepEqual(texts(dialog), ['Korekturu teď označit nejde.'])
  })

  it('sends a copy to its original, and says nothing of a Doc it does not know', () => {
    let copy = asDialog(
      decideProofreading({
        account: JAKUB,
        isConfirmed: false,
        target: {
          articleName: 'Volební kampaň na sítích',
          documentUrl: 'https://docs.google.com/document/d/fake-doc/edit',
          issueName: 'VDM_2026_5',
          kind: 'copy',
        },
      }),
    )
    assert.equal(copy.heading, 'Toto je kopie dokumentu článku')
    assert.deepEqual(texts(copy), [
      'Pro označení korektury otevřete původní dokument.',
      'Změny z kopie se do původního dokumentu samy nepřenesou.',
    ])
    assert.deepEqual(copy.actions[1], {
      kind: 'open',
      label: 'Otevřít původní',
      url: 'https://docs.google.com/document/d/fake-doc/edit',
    })

    let unknown = asDialog(
      decideProofreading({ account: JAKUB, isConfirmed: false, target: { kind: 'unknown' } }),
    )
    assert.equal(unknown.heading, 'Publikace tento dokument nezná')
    assert.equal(unknown.title, null)
    assert.deepEqual(texts(unknown), [
      'Pošlete šéfredakci odkaz na tento dokument.',
      'Korekturu v něm označit nejde.',
    ])
  })

  it('answers a refused account first, with nothing of the article', () => {
    let dialog = asDialog(decideProofreading({ account: null, isConfirmed: true, target: ARTICLE }))
    assert.equal(dialog.heading, 'Publikace váš účet nepřijala')
    assert.equal(dialog.title, null)
    assert.equal(dialog.meta, null)
    assert.ok(!JSON.stringify(dialog).includes('Volební'))
    assert.ok(!JSON.stringify(dialog).includes('VDM_2026_5'))
  })
})

describe('an article’s tag in the issue detail', () => {
  it('is Píše se with its creation day, then Korektura with who and since when', () => {
    let createdAt = Temporal.Instant.from('2026-11-10T08:00:00Z')
    assert.deepEqual(articleStateTag({ createdAt, proofreading: null }), {
      detail: 'založen 10. 11.',
      label: 'Píše se',
      tone: 'neutral',
    })
    assert.deepEqual(articleStateTag({ createdAt, proofreading: { at: AT, ...JAKUB } }), {
      detail: 'od 19. 11. · Jakub Novák',
      label: 'Korektura',
      tone: 'running',
    })
    assert.equal(
      articleStateTag({ createdAt, proofreading: { at: AT, email: JAKUB.email, name: null } })
        .detail,
      'od 19. 11. · jakub.novak@vednemesicnik.test',
    )
  })
})
