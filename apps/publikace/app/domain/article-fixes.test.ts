import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import type { ClauseDetail, ClauseState } from './approvals.ts'
import {
  articleForeignFilesCallout,
  authorsSavedToast,
  canEditAuthors,
  canRemoveArticle,
  canRenameArticle,
  isAgreed,
  movedArticleFolderCallout,
  removeArticleDialogText,
  removeArticleTakenToast,
} from './article-fixes.ts'
import { checkAuthors } from './public/article-form.ts'

function clause(state: ClauseState): Pick<ClauseDetail, 'state'> {
  return { state }
}

/** The words without the non-breaking spaces `tied` puts after one-letter words. */
function plain(text: string): string {
  return text.replaceAll(' ', ' ')
}

describe('where the fixes of an article stand (12u)', () => {
  it('rename only until the final version, in an open issue', () => {
    assert.equal(canRenameArticle({ finalVersion: null }, true), true)
    assert.equal(canRenameArticle({ finalVersion: null }, false), false)
    assert.equal(canRenameArticle({ finalVersion: { authors: [] } }, true), false)
  })

  it('edit the authors before the final version, and after it while one has not agreed', () => {
    assert.equal(canEditAuthors({ finalVersion: null }, true), true)
    let waiting = {
      authors: [clause('approved') as ClauseDetail, clause('review') as ClauseDetail],
    }
    assert.equal(canEditAuthors({ finalVersion: waiting }, true), true)
    let agreed = {
      authors: [clause('approved') as ClauseDetail, clause('verified') as ClauseDetail],
    }
    assert.equal(canEditAuthors({ finalVersion: agreed }, true), false)
    assert.equal(canEditAuthors({ finalVersion: null }, false), false)
  })

  it('count a consent as agreed whether archived, decided or failed to archive', () => {
    assert.deepEqual(
      (
        ['approved', 'verified', 'unarchived', 'pending', 'waiting', 'review', 'unsent'] as const
      ).filter(isAgreed),
      ['approved', 'verified', 'unarchived'],
    )
  })
})

describe('the toast after Upravit autory (12y)', () => {
  it('names one address, counts several, and says nothing of a welcome that did not go', () => {
    let one = authorsSavedToast(['lucie.kralova@external.test'], [])
    assert.equal(one.detail, 'Uvítací e-mail odešel na lucie.kralova@external.test')
    assert.equal(one.isError, false)
    assert.equal(plain(one.message), 'Údaje o autorech jsou uložené.')
    assert.equal(
      authorsSavedToast(['a@external.test', 'b@external.test'], []).detail,
      'Uvítací e-mail odešel na 2 adresy',
    )
    assert.equal(
      authorsSavedToast(
        ['1', '2', '3', '4', '5'].map((n) => `${n}@external.test`),
        [],
      ).detail,
      'Uvítací e-mail odešel na 5 adres',
    )
    assert.equal(authorsSavedToast([], []).detail, undefined)
  })

  it('asks the editor to send the link where the Mailer did not confirm it', () => {
    let toast = authorsSavedToast([], ['a@external.test', 'b@external.test'])
    assert.equal(toast.isError, true)
    assert.equal(
      plain(toast.message),
      'Pošlete odkaz na dokument na adresy uvedené níže. Údaje o autorech jsou uložené. Odeslání uvítacího e-mailu se nepodařilo potvrdit.',
    )
    assert.equal(toast.detail, 'a@external.test, b@external.test')
  })
})

describe('checking the cards after the final version (12y)', () => {
  it('keeps an emptied card in its place and refuses an agreed author’s address', () => {
    let check = checkAuthors(
      [
        { email: '', name: '' },
        { email: 'Tereza.Vlkova@external.test', name: 'Ondřej Beneš' },
      ],
      {
        fixed: [{ email: 'tereza.vlkova@external.test', number: 1 }],
        keepsEmptyCards: true,
        numbers: [2, 3],
      },
    )
    assert.deepEqual(
      check.errors.map((error) => error.key),
      ['author-2-name', 'author-2-email', 'author-3-email'],
    )
    assert.ok(plain(check.errors[2]?.message ?? '').includes('Stejnou má i autor 1.'))
  })
})

describe('Odebrat článek (12z)', () => {
  let name = 'Školní jídelna po roce'
  let none = { count: 0, isReplyWaiting: false }

  it('stands on Píše se and Dopsáno with no live batch, in an open issue', () => {
    assert.equal(canRemoveArticle('writing', 0, true), true)
    assert.equal(canRemoveArticle('handedOver', 0, true), true)
    assert.equal(canRemoveArticle('writing', 1, true), false)
    assert.equal(canRemoveArticle('proofreading', 0, true), false)
    assert.equal(canRemoveArticle('consent', 0, true), false)
    assert.equal(canRemoveArticle('writing', 0, false), false)
  })

  it('says the folder is in the bin already when it is', () => {
    assert.equal(
      plain(removeArticleDialogText(name, 'writing', true, none)[0] ?? ''),
      'Složka článku už je v koši sdíleného disku Publikace.',
    )
  })

  it('adds the reply paragraph for one discarded batch, for more, and with a reply waiting', () => {
    let one = removeArticleDialogText(name, 'writing', false, { count: 1, isReplyWaiting: false })
    assert.equal(
      plain(one.at(-1) ?? ''),
      'Pokud ještě přijde odpověď na žádost k zahozené dávce, najdete ji jen ve schránce publikace@.',
    )
    let two = removeArticleDialogText(name, 'writing', false, { count: 2, isReplyWaiting: true })
    assert.equal(
      plain(two.at(-1) ?? ''),
      'Pokud ještě přijde odpověď na žádost k zahozeným dávkám, najdete ji jen ve schránce publikace@. Odebráním článku zmizí z části Ke kontrole i odpověď, která tam už čeká.',
    )
    assert.equal(removeArticleDialogText(name, 'writing', false, none).length, 4)
  })

  it('names the proofreader and the day of a take that came meanwhile', () => {
    let toast = removeArticleTakenToast({
      at: Temporal.Instant.from('2026-11-24T09:00:00Z'),
      email: 'jakub.novak@vednemesicnik.test',
      name: 'Jakub Novák',
    })
    assert.equal(plain(toast.message), 'Korektura už probíhá. Článek zůstal ve vydání.')
    assert.equal(plain(toast.detail ?? ''), 'od 24. 11. · Jakub Novák')
  })

  it('names every file of a person, and the folder to put the article back in', () => {
    let files = ['a.docx', 'b.jpg', 'c.jpg', 'd.jpg'].map((name) => ({
      folderHref: 'https://drive.google.com/drive/folders/artworks-1',
      folderId: 'artworks-1',
      folderName: 'Obrazová díla',
      href: `https://drive.google.com/file/d/${name}/view`,
      name,
    }))
    let callout = articleForeignFilesCallout(files)
    assert.deepEqual(
      callout.groups?.map((group) => group.list.map((item) => item.text)),
      [['a.docx', 'b.jpg', 'c.jpg', 'd.jpg']],
    )
    assert.equal(plain(String(callout.text[0])), 'Článek zůstal, jak byl.')
    assert.equal(
      plain(String(callout.title[0])),
      'Přesuňte ze složky článku soubory, které do ní nedala aplikace.',
    )
    let moved = movedArticleFolderCallout(
      'https://drive.google.com/drive/folders/f-1',
      'VDM_2026_5',
    )
    let title = moved.title.map((part) => (typeof part === 'string' ? part : part.text)).join('')
    assert.equal(plain(title), 'Vraťte složku článku do složky Články vydání VDM_2026_5.')
  })
})
