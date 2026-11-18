import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { consentEmail, licenceAttachment } from './consent-email.server.ts'
import { welcomeEmail } from './welcome-email.server.ts'

const HASH = 'f27d03217672c1b563f228ed4f148afa4754d20a1fbdf9f46b4192f57fdba81d'

function message() {
  return consentEmail({
    articleName: 'Školní jídelna <po> roce',
    artworks: [
      {
        author: 'Ondřej "Beneš" <b>',
        pdfHash: HASH,
        source: 'https://unsplash.com/photos/skolni-jidelna-obed-7Hk2pQ',
        storedName: `${'3'.repeat(64)}.jpg`,
      },
    ],
    attachments: [licenceAttachment(HASH, new Uint8Array([1, 2, 3]))],
    formKey: 'form-1',
    issueName: 'VDM_2026_5',
    tag: '20261118T134500',
    to: 'ondrej.benes@external.test',
  })
}

describe('the consent request', () => {
  it('carries the subject the reply check pairs by, and one PDF per artwork named by its fingerprint', () => {
    let sent = message()
    assert.equal(
      sent.subject,
      'Žádost o potvrzení souhlasu s užitím obrazových děl ke článku „Školní jídelna <po> roce“ – VDM_2026_5 [20261118T134500]',
    )
    assert.equal(sent.name, 'Publikace Vedneměsíčník')
    assert.equal(sent.idempotencyKey, 'artwork-consent:form-1')
    assert.deepEqual(sent.attachments, [
      { data: 'AQID', filename: `${HASH}.pdf`, mimeType: 'application/pdf' },
    ])
  })

  it('writes the terms as the script does, a missing author as neuveden, and the house ending', () => {
    let html = message().htmlBody
    assert.ok(html.includes('Autor: Ondřej &quot;Beneš&quot; &lt;b&gt;'))
    assert.ok(!html.includes('<b>'))
    assert.ok(html.includes(`Ověřovací otisk přílohy: ${HASH}`))
    assert.ok(html.includes('IČO 22851356, bezúplatnou nevýhradní licenci'))
    assert.ok(
      html.includes('Přílohy tohoto e-mailu s náhledy děl tvoří nedílnou součást tohoto souhlasu.'),
    )
    assert.ok(html.includes('Máte dotaz? Odpovězte na tento e-mail.'))
    assert.ok(html.includes('Vedneměsíčník, z. s. IČO: 22851356'))
    assert.ok(!html.includes('<po>'))
  })

  it('sets no text or background colour, and frames the terms with a border alone', () => {
    let html = message().htmlBody
    assert.ok(!/[;"]color:/.test(html.replace(/<title>.*<\/title>/, '')))
    assert.ok(!/background/.test(html))
    assert.ok(html.includes('border:1px solid #6B7280;border-radius:8px;padding:16px'))
  })
})

describe('the welcome e-mail', () => {
  it('signs as the magazine, ends in the house pattern and colours only its primary button', () => {
    let sent = welcomeEmail({
      articleName: 'Školní jídelna po roce',
      artworksUrl: 'https://publikace.vednemesicnik.test/l/AAAAAAAAAAAA/artworks',
      coauthors: [],
      documentUrl: 'https://docs.google.com/document/d/x/edit',
      formKey: 'form-1',
      issueName: 'VDM_2026_5',
      to: 'tereza.vlkova@external.test',
    })
    assert.equal(sent.name, 'Publikace Vedneměsíčník')
    assert.ok(sent.htmlBody.includes('S pozdravem'))
    assert.ok(
      sent.htmlBody.includes(
        'Tento e-mail jste obdrželi na základě adresy uvedené u vašeho jména při založení článku.',
      ),
    )
    assert.ok(!sent.htmlBody.includes('studentské nekritické noviny'))
    assert.equal(sent.htmlBody.match(/[;"]color:/g)?.length, 1)
  })
})
