import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import type { ClauseDetail, ClauseState } from './approvals.ts'
import { authorsSavedToast, canEditAuthors, canRenameArticle, isAgreed } from './article-fixes.ts'
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
