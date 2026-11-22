import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import {
  approvedArtworksLine,
  articleArtworksLine,
  authorAndSource,
  batchState,
  batchStateDetail,
  type BatchStatus,
  batchTag,
  compareArtworks,
  consentSubject,
  discardDialogTitle,
  imageTypeOf,
  isMailError,
  NO_ARTWORKS,
  replyExcerpt,
  resendLabel,
  sentArtworkLine,
  sentLead,
  shownSource,
} from './artwork.ts'
import {
  checkArtworks,
  checkSource,
  choiceRefusal,
  claimedType,
  dropLine,
  EMPTY_PROVIDER_EMAIL_MESSAGE,
  EMPTY_PROVIDER_NAME_MESSAGE,
  formatSize,
  LONG_ARTWORK_AUTHOR_MESSAGE,
  MAX_FILE_BYTES,
  NO_ARTWORKS_MESSAGE,
  SOURCE_HOME_PAGE_MESSAGE,
  SOURCE_NOT_URL_MESSAGE,
  TOO_MANY_NOTE,
} from './public/artwork-form.ts'

const ONDREJ = { email: 'ondrej.benes@external.test', name: 'Ondřej Beneš' }

describe('batchTag', () => {
  it('is Prague time to the second', () => {
    assert.equal(batchTag(Temporal.Instant.from('2026-11-18T12:45:00Z')), '20261118T134500')
    assert.equal(batchTag(Temporal.Instant.from('2026-07-01T22:05:09Z')), '20260702T000509')
  })
})

describe('imageTypeOf', () => {
  it('reads the allowed types from their first bytes', () => {
    let bytes = (...values: number[]) =>
      new Uint8Array([...values, ...Array.from({ length: 16 }, () => 0)])
    let text = (value: string) => [...value].map((character) => character.charCodeAt(0))
    assert.equal(imageTypeOf(bytes(0xff, 0xd8, 0xff, 0xe0)), 'image/jpeg')
    assert.equal(imageTypeOf(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)), 'image/png')
    assert.equal(imageTypeOf(bytes(...text('GIF89a'))), 'image/gif')
    assert.equal(imageTypeOf(bytes(...text('RIFF'), 0, 0, 0, 0, ...text('WEBP'))), 'image/webp')
    assert.equal(imageTypeOf(bytes(0x49, 0x49, 0x2a, 0x00)), 'image/tiff')
    assert.equal(imageTypeOf(bytes(0, 0, 0, 24, ...text('ftypheic'))), 'image/heic')
    assert.equal(imageTypeOf(bytes(...text('%PDF-1.7'))), null)
  })
})

describe('consentSubject', () => {
  it('starts with the prefix the reply check allows and ends with the tag', () => {
    assert.equal(
      consentSubject('Školní jídelna po roce', 'VDM_2026_5', '20261118T134500'),
      'Žádost o potvrzení souhlasu s užitím obrazových děl ke článku „Školní jídelna po roce“ – VDM_2026_5 [20261118T134500]',
    )
  })
})

describe('batchState', () => {
  let at = Temporal.Instant.from('2026-11-18T12:45:00Z')
  let sent: BatchStatus = {
    approvedAt: null,
    archiveFailedAt: null,
    consentVerifiedAt: null,
    discardedAt: null,
    isExactConsent: false,
    mailRefusedAt: null,
    mailSentAt: at,
    replyMessageId: null,
    replyText: null,
  }
  let replied: BatchStatus = { ...sent, replyMessageId: 'm-1', replyText: 'ok, souhlas\nKlára' }

  it('is with the provider once the Mailer accepted the request', () => {
    assert.equal(batchState(sent), 'provider')
    assert.equal(batchStateDetail(sent), 'žádost odeslána 18. 11.')
  })

  it('is an error until then, and says whether the Mailer refused it for good', () => {
    let unsent = { ...sent, mailSentAt: null }
    assert.equal(batchState(unsent), 'error')
    assert.equal(isMailError(unsent), true)
    assert.equal(batchStateDetail(unsent), 'chybí potvrzení o\u00a0odeslání žádosti')
    assert.equal(batchStateDetail({ ...unsent, mailRefusedAt: at }), 'pošta žádost trvale odmítla')
  })

  it('waits on the editors for a reply that is not exactly „Souhlasím“, quoting its first line', () => {
    assert.equal(batchState(replied), 'review')
    assert.equal(batchStateDetail(replied), 'odpověď „ok, souhlas“')
  })

  it('takes a reply over a request the Mailer never confirmed', () => {
    assert.equal(batchState({ ...replied, mailSentAt: null }), 'review')
  })

  it('leaves an exact „Souhlasím“ to the job, but not on a discarded batch', () => {
    let exact = { ...replied, isExactConsent: true, replyText: 'Souhlasím' }
    assert.equal(batchState(exact), 'provider')
    let discarded = { ...exact, discardedAt: at }
    assert.equal(batchState(discarded), 'review')
    assert.equal(batchStateDetail(discarded), 'dávka zahozena 18. 11.')
  })

  it('is with the provider after Je to souhlas, then an error when the archive fails', () => {
    let verified = { ...replied, consentVerifiedAt: at }
    assert.equal(batchState(verified), 'provider')
    assert.equal(batchStateDetail(verified), 'souhlas zaznamenán 18. 11.')
    let failed = { ...verified, archiveFailedAt: at }
    assert.equal(batchState(failed), 'error')
    assert.equal(isMailError(failed), false)
    assert.equal(batchStateDetail(failed), 'konverzace se neuložila')
  })

  it('is approved once the conversation is in Licence', () => {
    let approved = { ...replied, approvedAt: at, replyText: null }
    assert.equal(batchState(approved), 'approved')
    assert.equal(batchStateDetail(approved), 'konverzace v\u00a0Licencích')
  })
})

describe('replyExcerpt', () => {
  it('keeps the first line and cuts a long one', () => {
    assert.equal(replyExcerpt('  ok, souhlas  \ndíky'), 'ok, souhlas')
    assert.equal(replyExcerpt('a'.repeat(60)), `${'a'.repeat(39)}…`)
  })
})

describe('articleArtworksLine', () => {
  it('shows only what waits, errors first', () => {
    assert.deepEqual(articleArtworksLine({ ...NO_ARTWORKS, error: 1, provider: 1, review: 2 }), {
      isWaiting: true,
      text: '1 s\u00a0chybou · 2 ke kontrole',
    })
    assert.deepEqual(articleArtworksLine({ ...NO_ARTWORKS, error: 2, provider: 2 }), {
      isWaiting: true,
      text: '2 s\u00a0chybou',
    })
  })

  it('shows the progress otherwise', () => {
    assert.equal(articleArtworksLine({ ...NO_ARTWORKS, approved: 3 })?.text, 'všechna schválená')
    assert.equal(articleArtworksLine({ ...NO_ARTWORKS, approved: 1 })?.text, 'schválené')
    assert.equal(
      articleArtworksLine({ ...NO_ARTWORKS, approved: 2, provider: 1 })?.text,
      '2 schválená',
    )
    assert.equal(
      articleArtworksLine({ ...NO_ARTWORKS, approved: 5, provider: 1 })?.text,
      '5 schválených',
    )
    assert.equal(articleArtworksLine({ ...NO_ARTWORKS, provider: 2 })?.text, 'u\u00a0poskytovatele')
    assert.equal(articleArtworksLine(NO_ARTWORKS), null)
  })
})

describe('compareArtworks', () => {
  it('puts errors first, then what waits for review, then the newest upload', () => {
    let older = Temporal.Instant.from('2026-11-17T10:00:00Z')
    let newer = Temporal.Instant.from('2026-11-18T10:00:00Z')
    let rows = [
      { name: 'a', state: 'provider' as const, uploadedAt: older },
      { name: 'b', state: 'provider' as const, uploadedAt: newer },
      { name: 'c', state: 'review' as const, uploadedAt: older },
      { name: 'd', state: 'error' as const, uploadedAt: older },
    ]
    assert.deepEqual(
      rows.sort(compareArtworks).map((row) => row.name),
      ['d', 'c', 'b', 'a'],
    )
  })
})

describe('the short lines', () => {
  it('cut a source to its site and first segment', () => {
    assert.equal(
      shownSource('https://unsplash.com/photos/skolni-jidelna-obed-7Hk2pQ'),
      'unsplash.com/photos/…',
    )
    assert.equal(shownSource('https://example.test/obrazek'), 'example.test/obrazek')
  })

  it('name a missing author or source', () => {
    assert.equal(authorAndSource('Tereza Vlková', null), 'Tereza Vlková · neuveden')
    assert.equal(
      sentArtworkLine(null, 'https://unsplash.com/photos/a/b'),
      'autor neuveden · unsplash.com/photos/…',
    )
    assert.equal(sentArtworkLine('Ondřej Beneš', null), 'Ondřej Beneš · zdroj neuveden')
  })

  it('agree with the count', () => {
    assert.equal(
      sentLead(2, 'Školní jídelna po roce'),
      '2 díla k\u00a0článku „Školní jídelna po roce“ jsou nahraná.',
    )
    assert.equal(resendLabel(2), 'Poslat žádost znovu · 2 díla')
    assert.equal(resendLabel(5), 'Poslat žádost znovu · 5 děl')
    assert.equal(discardDialogTitle(2), 'Zahodit dávku 2 děl?')
    assert.equal(dropLine(2), 'Pusťte 2 soubory sem')
    assert.equal(dropLine(5), 'Pusťte 5 souborů sem')
  })
})

describe('choiceRefusal', () => {
  it('refuses a file that is no image, or one over 15 MB', () => {
    assert.equal(
      choiceRefusal({ name: 'clanek.docx', size: 1000, type: 'application/msword' }),
      'Vyberte obrázek — clanek.docx není obrázek.',
    )
    assert.equal(
      choiceRefusal({ name: 'ples.tif', size: 22 * 1024 * 1024, type: 'image/tiff' }),
      'Vyberte obrázek do 15 MB — ples.tif má 22 MB.',
    )
    assert.equal(choiceRefusal({ name: 'a.jpg', size: MAX_FILE_BYTES, type: 'image/jpeg' }), null)
  })

  it('reads a HEIC the browser gives no type by its extension', () => {
    assert.equal(claimedType({ name: 'IMG_4471.HEIC', type: '' }), 'image/heic')
    assert.equal(claimedType({ name: 'IMG_4471.heic', type: 'text/plain' }), null)
  })

  it('formats a size the Czech way', () => {
    assert.equal(formatSize(3.2 * 1024 * 1024), '3,2 MB')
  })
})

describe('checkSource', () => {
  it('allows nothing, or an https address of the artwork itself', () => {
    assert.equal(checkSource(''), null)
    assert.equal(checkSource('https://unsplash.com/photos/jidelna-a8Kq'), null)
    assert.equal(checkSource('https://example.test/?id=4'), null)
  })

  it('refuses what is no full https address', () => {
    assert.equal(checkSource('unsplash.com/photos/a'), SOURCE_NOT_URL_MESSAGE)
    assert.equal(checkSource('http://unsplash.com/photos/a'), SOURCE_NOT_URL_MESSAGE)
    assert.equal(checkSource('https:unsplash.com/photos/a'), SOURCE_NOT_URL_MESSAGE)
    assert.equal(checkSource('https:/unsplash.com/photos/a'), SOURCE_NOT_URL_MESSAGE)
  })

  it('refuses a site’s home page', () => {
    assert.equal(checkSource('https://unsplash.com'), SOURCE_HOME_PAGE_MESSAGE)
    assert.equal(checkSource('https://unsplash.com/'), SOURCE_HOME_PAGE_MESSAGE)
  })
})

describe('checkArtworks', () => {
  it('accepts a provider and artworks, trimmed', () => {
    let check = checkArtworks({
      artworks: [{ author: ' Ondřej Beneš ', id: 4, source: '' }],
      provider: { email: ` ${ONDREJ.email}`, name: `${ONDREJ.name} ` },
    })
    assert.deepEqual(check, {
      batch: { artworks: [{ author: 'Ondřej Beneš', id: 4, source: '' }], provider: ONDREJ },
      ok: true,
    })
  })

  it('reports each field by where it belongs', () => {
    let check = checkArtworks({
      artworks: [{ author: 'x'.repeat(201), id: 1, source: 'https://unsplash.com' }],
      provider: { email: '', name: '' },
    })
    assert.deepEqual(check.ok ? [] : check.errors, [
      { key: 'provider-name', message: EMPTY_PROVIDER_NAME_MESSAGE },
      { key: 'provider-email', message: EMPTY_PROVIDER_EMAIL_MESSAGE },
      { key: 'artwork-1-author', message: LONG_ARTWORK_AUTHOR_MESSAGE },
      { key: 'artwork-1-source', message: SOURCE_HOME_PAGE_MESSAGE },
    ])
  })

  it('needs one artwork and allows twenty', () => {
    let none = checkArtworks({ artworks: [], provider: ONDREJ })
    assert.deepEqual(none.ok ? [] : none.errors, [
      { key: 'artworks', message: NO_ARTWORKS_MESSAGE },
    ])
    let many = checkArtworks({
      artworks: Array.from({ length: 21 }, (_, id) => ({ author: '', id, source: '' })),
      provider: ONDREJ,
    })
    assert.deepEqual(many.ok ? [] : many.errors, [{ key: 'artworks', message: TOO_MANY_NOTE }])
    let twenty = checkArtworks({
      artworks: Array.from({ length: 20 }, (_, id) => ({ author: '', id, source: '' })),
      provider: ONDREJ,
    })
    assert.equal(twenty.ok, true)
  })
})

describe('approvedArtworksLine (11a)', () => {
  it('counts the approved in Czech, all of them as všechna schválená', () => {
    let line = (approved: number, total: number) => approvedArtworksLine({ approved, total })
    assert.equal(line(0, 0), null)
    assert.equal(line(1, 1), 'schválené')
    assert.equal(line(14, 14), 'všechna schválená')
    assert.equal(line(0, 3), '0 schválených')
    assert.equal(line(1, 5), '1 schválené')
    assert.equal(line(3, 5), '3 schválená')
    assert.equal(line(7, 13), '7 schválených')
  })
})
