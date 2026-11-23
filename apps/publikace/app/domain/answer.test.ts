import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import {
  answerCallout,
  answerHint,
  answerIdempotencyKey,
  answersTitle,
  checkAnswer,
  isInFlight,
  quoteIntro,
  signatureOf,
} from './answer.ts'

/** The words without the non-breaking spaces `tied` puts after one-letter words. */
function plain(text: string): string {
  return text.replaceAll(' ', ' ')
}

describe('an answer from Ke kontrole', () => {
  it('goes as typed, a CR LF counted as one break, and never blank', () => {
    assert.deepEqual(checkAnswer('  Dobrý den,\r\nano.  '), { ok: true, text: 'Dobrý den,\nano.' })
    assert.deepEqual(checkAnswer(' \n\t'), { error: 'Napište odpověď.', ok: false, text: '' })
  })

  it('stops at 5 000 characters and says how many it has', () => {
    assert.equal(checkAnswer('a'.repeat(5000)).ok, true)
    let long = checkAnswer('a'.repeat(5214))
    assert.equal(long.ok, false)
    assert.equal(
      plain(long.ok ? '' : long.error),
      'Zkraťte odpověď na nejvýš 5 000 znaků. Teď jich má 5 214.',
    )
  })

  it('is signed by name, or by the newsroom alone where Google gave none', () => {
    assert.equal(
      signatureOf({ displayName: 'Marie Horáková', email: 'marie@vednemesicnik.test' }),
      'Marie Horáková',
    )
    let unnamed = { displayName: 'marie@vednemesicnik.test', email: 'marie@vednemesicnik.test' }
    assert.equal(signatureOf(unnamed), null)
    assert.match(plain(answerHint('artworks', false)), /Pod textem bude podpis redakce/)
    assert.match(plain(answerHint('articles', true)), /jen tomuto autorovi/)
  })

  it('has one key per message of the provider', () => {
    assert.equal(answerIdempotencyKey('artworks', 4, 'm-1'), 'consent-answer:batch:4:m-1')
    assert.equal(answerIdempotencyKey('articles', 4, 'm-1'), 'consent-answer:clause:4:m-1')
  })

  it('speaks of the provider or the author, and never says an article was approved', () => {
    let context = { email: 'klara.simkova@external.test', issueName: 'VDM_2026_5' }
    assert.equal(
      answerCallout('newer-reply', { ...context, kind: 'artworks' }).title,
      'Přečtěte si novou odpověď poskytovatele.',
    )
    assert.equal(
      answerCallout('approved', { ...context, kind: 'articles' }).title,
      'Od autora mezitím přišla odpověď „Souhlasím“.',
    )
    assert.equal(answerCallout('approved', { ...context, kind: 'articles' }).tone, 'success')
    assert.equal(
      plain(answerCallout('closed', { ...context, kind: 'artworks' }).title),
      'Vydání VDM_2026_5 je mezitím uzavřené.',
    )
  })

  it('counts an answer with no outcome as on its way for a minute, then as retryable', () => {
    let startedAt = Temporal.Instant.from('2026-11-23T10:00:00Z')
    let open = { failedAt: null, refusedAt: null, sentAt: null, startedAt }
    assert.equal(isInFlight(open, startedAt.add({ seconds: 30 })), true)
    assert.equal(isInFlight(open, startedAt.add({ seconds: 61 })), false)
    assert.equal(isInFlight({ ...open, failedAt: startedAt }, startedAt), false)
  })

  it('names the earlier answers apart from the ones just sent', () => {
    assert.equal(answersTitle(1, false), 'Odpovědi z Publikace (1)')
    assert.equal(answersTitle(4, true), 'Dřívější odpovědi z Publikace (4)')
  })

  it('introduces the quote with the moment the message came, with v or ve', () => {
    assert.equal(
      plain(quoteIntro(Temporal.Instant.from('2026-11-14T07:30:00Z'))),
      'Vaše zpráva přijatá 14. 11. 2026 v 8:30:',
    )
    assert.equal(
      plain(quoteIntro(Temporal.Instant.from('2026-11-14T21:05:00Z'))),
      'Vaše zpráva přijatá 14. 11. 2026 ve 22:05:',
    )
  })
})
