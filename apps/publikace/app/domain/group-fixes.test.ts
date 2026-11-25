import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import {
  canEditGroup,
  canRemoveGroup,
  isGroupRename,
  movedGroupFolderCallout,
  otherGroupNames,
  removeGroupDialogText,
  removeGroupTitle,
} from './group-fixes.ts'

/** The words without the non-breaking spaces `tied` puts after one-letter words. */
function plain(text: string): string {
  return text.replaceAll('\u00a0', ' ')
}

describe('where the fixes of a group stand (12u)', () => {
  it('edits in an open issue only', () => {
    assert.equal(canEditGroup(true), true)
    assert.equal(canEditGroup(false), false)
  })

  it('removes a group without artworks in an open issue only', () => {
    assert.equal(canRemoveGroup(0, true), true)
    assert.equal(canRemoveGroup(2, true), false)
    assert.equal(canRemoveGroup(0, false), false)
  })
})

describe('what renames a group folder (12f)', () => {
  it('is a name that differs as stored, a change of case included', () => {
    assert.equal(isGroupRename('Mapa obce', 'Mapa obce'), false)
    assert.equal(isGroupRename('Mapa obce', '  Mapa obce '), false)
    assert.equal(isGroupRename('Mapa obce', 'mapa obce'), true)
    assert.equal(isGroupRename('Mapa obce', 'Mapa  obce'), true)
  })

  it('checks the name against the other groups, never the group’s own', () => {
    let names = new Map([
      ['mapa obce', 'Mapa obce'],
      ['ilustrace', 'Ilustrace'],
    ])
    assert.deepEqual([...otherGroupNames(names, 'Mapa obce').keys()], ['ilustrace'])
  })
})

describe('the removal dialog of a group (12f)', () => {
  it('names the group in quotes in the title', () => {
    assert.equal(
      plain(removeGroupTitle('Mapa obce k rozhovoru i reportáži')),
      'Odebrat skupinu „Mapa obce k rozhovoru i reportáži“?',
    )
  })

  it('has four paragraphs without discarded batches', () => {
    let text = removeGroupDialogText({ count: 0, isReplyWaiting: false }).map(plain)
    assert.deepEqual(text, [
      'Složka skupiny se přesune do koše sdíleného disku Publikace i s nahranými soubory, které nikdo neodeslal.',
      'Skupina zmizí z vydání. Odkaz na nahrání děl přestane platit.',
      'Obnovením složky z koše se skupina do aplikace nevrátí.',
      'Nikomu se nic nepošle.',
    ])
  })

  it('adds the replies to discarded batches, and the one already waiting', () => {
    let one = removeGroupDialogText({ count: 1, isReplyWaiting: false }).map(plain)
    assert.equal(
      one[4],
      'Pokud ještě přijde odpověď na žádost k zahozené dávce, najdete ji jen ve schránce publikace@.',
    )
    let more = removeGroupDialogText({ count: 2, isReplyWaiting: true }).map(plain)
    assert.equal(
      more[4],
      'Pokud ještě přijde odpověď na žádost k zahozeným dávkám, najdete ji jen ve schránce publikace@. Odebráním skupiny zmizí z části Ke kontrole i odpověď, která tam už čeká.',
    )
  })

  it('links the moved folder and names the issue it belongs in', () => {
    let callout = movedGroupFolderCallout('https://drive.google.com/drive/folders/g1', 'VDM_2003_1')
    assert.deepEqual(
      callout.title.map((part) => (typeof part === 'string' ? plain(part) : part)),
      [
        'Vraťte ',
        { href: 'https://drive.google.com/drive/folders/g1', text: 'složku skupiny' },
        ' do složky Skupiny obrazových děl vydání VDM_2003_1.',
      ],
    )
  })
})
