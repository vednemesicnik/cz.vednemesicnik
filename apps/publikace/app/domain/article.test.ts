import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import {
  articleMeta,
  articleState,
  articleStateTag,
  STATE_ORDER,
  AUTHOR_LIMIT_NOTE,
  checkArticle,
  coauthorLine,
  EMPTY_ARTICLE_NAME_MESSAGE,
  EMPTY_AUTHOR_EMAIL_MESSAGE,
  EMPTY_AUTHOR_NAME_MESSAGE,
  INVALID_EMAIL_MESSAGE,
  joinNames,
  LONG_ARTICLE_NAME_MESSAGE,
  MISSING_AT_MESSAGE,
  summaryTitle,
} from './article.ts'

const TEREZA = { email: 'tereza.vlkova@external.test', name: 'Tereza Vlková' }
const ONDREJ = { email: 'ondrej.benes@external.test', name: 'Ondřej Beneš' }

function errorsOf(input: Parameters<typeof checkArticle>[0]) {
  let check = checkArticle(input)
  return check.ok ? [] : check.errors
}

describe('checkArticle', () => {
  it('accepts a name and its authors, trimmed', () => {
    let check = checkArticle({
      authors: [{ email: ` ${TEREZA.email} `, name: ` ${TEREZA.name}` }, ONDREJ],
      name: '  Školní jídelna po roce ',
    })
    assert.deepEqual(check, {
      article: { authors: [TEREZA, ONDREJ], name: 'Školní jídelna po roce' },
      ok: true,
    })
  })

  it('drops a card left wholly empty, without an error', () => {
    let check = checkArticle({
      authors: [TEREZA, { email: '', name: ' ' }],
      name: 'Školní jídelna po roce',
    })
    assert.equal(check.ok, true)
    if (check.ok) assert.deepEqual(check.article.authors, [TEREZA])
  })

  it('keeps the first card of an empty form, with both of its errors', () => {
    assert.deepEqual(errorsOf({ authors: [{ email: '', name: '' }], name: '' }), [
      { key: 'name', message: EMPTY_ARTICLE_NAME_MESSAGE },
      { key: 'author-1-name', message: EMPTY_AUTHOR_NAME_MESSAGE },
      { key: 'author-1-email', message: EMPTY_AUTHOR_EMAIL_MESSAGE },
    ])
  })

  it('names the missing half of a card', () => {
    assert.deepEqual(
      errorsOf({ authors: [{ email: '', name: 'Tereza Vlková' }], name: 'Článek' }),
      [{ key: 'author-1-email', message: EMPTY_AUTHOR_EMAIL_MESSAGE }],
    )
    assert.deepEqual(errorsOf({ authors: [{ email: TEREZA.email, name: '' }], name: 'Článek' }), [
      { key: 'author-1-name', message: EMPTY_AUTHOR_NAME_MESSAGE },
    ])
  })

  it('refuses a name over 200 characters, counted as characters', () => {
    assert.deepEqual(errorsOf({ authors: [TEREZA], name: 'č'.repeat(201) }), [
      { key: 'name', message: LONG_ARTICLE_NAME_MESSAGE },
    ])
    assert.deepEqual(errorsOf({ authors: [TEREZA], name: 'č'.repeat(200) }), [])
  })

  it('says a missing @ apart from any other malformed address', () => {
    assert.deepEqual(
      errorsOf({ authors: [{ ...TEREZA, email: 'tereza.external.test' }], name: 'Č' }),
      [{ key: 'author-1-email', message: MISSING_AT_MESSAGE }],
    )
    assert.deepEqual(errorsOf({ authors: [{ ...TEREZA, email: 'tereza@external' }], name: 'Č' }), [
      { key: 'author-1-email', message: INVALID_EMAIL_MESSAGE },
    ])
  })

  it('points the second use of an address at the first author who has it', () => {
    assert.deepEqual(
      errorsOf({
        authors: [TEREZA, { ...ONDREJ, email: 'Tereza.Vlkova@external.test' }],
        name: 'Č',
      }),
      [{ key: 'author-2-email', message: 'Zkontrolujte adresu. Stejnou má i\u00a0autor 1.' }],
    )
  })

  it('refuses an eleventh author on the group', () => {
    let authors = Array.from({ length: 11 }, (_, index) => ({
      email: `autor${index}@external.test`,
      name: `Autor ${index}`,
    }))
    assert.deepEqual(errorsOf({ authors, name: 'Č' }), [
      { key: 'authors', message: AUTHOR_LIMIT_NOTE },
    ])
  })
})

describe('summaryTitle', () => {
  it('declines with the count', () => {
    assert.equal(summaryTitle(1), 'Opravte 1 pole')
    assert.equal(summaryTitle(3), 'Opravte 3 pole')
    assert.equal(summaryTitle(5), 'Opravte 5 polí')
  })
})

describe('joinNames', () => {
  it('joins with an ordinary a unless told otherwise', () => {
    assert.equal(joinNames(['Alex Novák', 'Robin Malá']), 'Alex Novák a Robin Malá')
    assert.equal(joinNames(['Alex Novák']), 'Alex Novák')
  })
})

describe('coauthorLine', () => {
  it('is missing for a single author and follows the count otherwise', () => {
    assert.equal(coauthorLine([]), null)
    assert.equal(coauthorLine(['Ondřej Beneš']), 'Na článku se také podílí Ondřej Beneš.')
    assert.equal(
      coauthorLine(['Alex Novák', 'Robin Malá', 'Jan Novák']),
      'Na článku se také podílejí Alex Novák, Robin Malá a\u00a0Jan Novák.',
    )
  })
})

describe('articleMeta', () => {
  it('keeps the shape the Doc menu and the artwork upload read', () => {
    let meta = JSON.parse(
      articleMeta({
        articleFolderId: 'f-article',
        articleName: 'Školní jídelna po roce',
        authors: [TEREZA],
        docId: 'd-1',
        issue: 'VDM_2026_5',
        issueFolderId: 'f-issue',
      }),
    )
    assert.deepEqual(meta, {
      articleFolderId: 'f-article',
      articleName: 'Školní jídelna po roce',
      authors: [
        { authorEmail: TEREZA.email, authorName: TEREZA.name, authorSignature: TEREZA.name },
      ],
      docId: 'd-1',
      issue: 'VDM_2026_5',
      issueFolderId: 'f-issue',
      sheetId: null,
    })
  })
})

describe('the state of an article (01a)', () => {
  const CREATED = Temporal.Instant.from('2026-11-10T08:00:00Z')
  const HANDED = Temporal.Instant.from('2026-11-13T17:04:00Z')
  const MARIE = { at: HANDED, email: 'marie@vednemesicnik.test', name: 'Marie Horáková' }
  const JAKUB = { at: HANDED.add({ hours: 20 }), email: 'jakub@vednemesicnik.test', name: null }

  it('is Dopsáno with its handover’s day, and Korektura wins over it', () => {
    let handedOver = { createdAt: CREATED, handover: MARIE, proofreading: null }
    assert.equal(articleState(handedOver), 'handedOver')
    assert.deepEqual(articleStateTag(handedOver), {
      detail: 'od 13. 11.',
      label: 'Dopsáno',
      tone: 'running',
    })
    let taken = { ...handedOver, proofreading: JAKUB }
    assert.equal(articleState(taken), 'proofreading')
    assert.equal(articleStateTag(taken).detail, 'od 14. 11. · jakub@vednemesicnik.test')
  })

  it('orders proofreading first, then what waits for a proofreader, then what is written', () => {
    let states = (['writing', 'proofreading', 'handedOver'] as const).toSorted(
      (a, b) => STATE_ORDER[a] - STATE_ORDER[b],
    )
    assert.deepEqual(states, ['proofreading', 'handedOver', 'writing'])
  })
})
