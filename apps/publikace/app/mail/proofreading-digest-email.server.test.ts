import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import type { Digest, DigestCandidate } from '../domain/proofreading-digest.ts'
import { digestEmail, digestIdempotencyKey } from './proofreading-digest-email.server.ts'

const TODAY = Temporal.Instant.from('2026-11-21T06:12:00Z')
const HANDED = Temporal.Instant.from('2026-11-20T09:00:00Z')

function article(id: number, extra: Partial<DigestCandidate> = {}): DigestCandidate {
  return {
    announcedAt: null,
    authors: ['Ondřej Beneš', 'Tomáš Krejčí'],
    cancelledAt: null,
    handedOverAt: HANDED,
    id,
    issueName: 'VDM_2026_5',
    name: `Zahrada <na> střeše ${id}`,
    ...extra,
  }
}

const DIGEST: Digest = {
  cancelled: [article(2, { announcedAt: HANDED, cancelledAt: HANDED.add({ hours: 2 }) })],
  handedOver: [article(1)],
  waiting: [],
}

function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll(' ', ' ')
    .replace(/\s+/g, ' ')
}

describe('the proofreaders’ morning digest (12n)', () => {
  let message = digestEmail({
    digest: DIGEST,
    lastSentAt: null,
    origin: 'https://publikace.vednemesicnik.test',
    to: 'korektori@vednemesicnik.test',
    today: TODAY,
  })

  it('goes to the proofreaders under the same subject every day but for the date', () => {
    assert.equal(message.to, 'korektori@vednemesicnik.test')
    assert.equal(message.subject, 'Ke korektuře – 21. 11. 2026')
    assert.equal(message.name, 'Publikace Vedneměsíčník')
  })

  it('says the parts that are not empty, the cancelled one without authors or a button', () => {
    let text = textOf(message.htmlBody)
    assert.ok(text.includes('Nově předané'))
    assert.ok(text.includes('Zrušená předání U těchto článků šéfredakce zrušila předání.'))
    assert.ok(!text.includes('Stále čekají na korekturu'))
    assert.ok(text.includes('Vydání VDM_2026_5 · předáno 20. 11.'))
    assert.ok(text.includes('Vydání VDM_2026_5 · předání zrušeno 20. 11.'))
    assert.equal(text.match(/Autoři: Ondřej Beneš, Tomáš Krejčí/g)?.length, 1)
    assert.equal(text.match(/Otevřít v Publikaci/g)?.length, 1)
    assert.ok(
      message.htmlBody.includes(
        'href="https://publikace.vednemesicnik.test/proofreading?article=1"',
      ),
    )
    assert.ok(
      message.htmlBody.includes('aria-label="Otevřít v Publikaci „Zahrada &lt;na&gt; střeše 1“"'),
    )
  })

  it('keeps names as typed, escaped, and ends in the house footer with why it came', () => {
    assert.ok(message.htmlBody.includes('Zahrada &lt;na&gt; střeše 1'))
    let text = textOf(message.htmlBody)
    assert.ok(text.includes('stránku Korektura a u článku zvolte Vzít si korekturu.'))
    assert.ok(text.includes('Přehled posíláme, když přibude nové předání'))
    assert.ok(text.includes('IČO: 22851356'))
  })

  it('keeps its idempotency key while its content stays, and changes it with the content', () => {
    let to = 'korektori@vednemesicnik.test'
    assert.equal(message.idempotencyKey, digestIdempotencyKey({ ...DIGEST }, to, null))
    assert.notEqual(
      message.idempotencyKey,
      digestIdempotencyKey({ ...DIGEST, waiting: [article(3, { announcedAt: TODAY })] }, to, null),
    )
    assert.notEqual(
      message.idempotencyKey,
      digestIdempotencyKey(DIGEST, 'jini@vednemesicnik.test', null),
    )
    assert.notEqual(message.idempotencyKey, digestIdempotencyKey(DIGEST, to, TODAY))
  })
})
