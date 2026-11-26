import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { consentEmail, licenceAttachment } from './consent-email.server.ts'
import { welcomeEmail } from './welcome-email.server.ts'

const HASH = 'f27d03217672c1b563f228ed4f148afa4754d20a1fbdf9f46b4192f57fdba81d'

/*
 * A one-letter preposition or conjunction followed by an ordinary space. The e-mails write a
 * no-break space after each in their own text; a value a person typed keeps its spaces.
 */
const LOOSE_ONE_LETTER_WORD = /(?<=^|[\s„(])[aikosuvz] /iu

/**
 * The e-mail's own text: the tags gone, and the title with them, because it is the subject, which
 * the reply checks search by and which stays as it is; the values a person typed taken out.
 */
function ownText(html: string, typed: readonly string[]): string {
  let text = html.replace(/<title>.*<\/title>/, '').replace(/<[^>]+>/g, '\n')
  for (let value of typed) text = text.replaceAll(value, '')
  return text
}

function message() {
  return consentEmail({
    holder: { kind: 'article', name: 'Školní jídelna <po> roce' },
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
      html.includes(
        'Přílohy tohoto e-mailu s\u00a0náhledy děl tvoří nedílnou součást tohoto souhlasu.',
      ),
    )
    assert.ok(html.includes('Máte dotaz? Odpovězte na tento e-mail.'))
    assert.ok(html.includes('Vedneměsíčník, z. s. IČO: 22851356'))
    assert.ok(!html.includes('<po>'))
  })

  it('opens with the logo of the magazine from its website', () => {
    let html = message().htmlBody
    assert.ok(
      html.includes(
        '<body style="margin:0;padding:24px;font-family:\'Helvetica Neue\',Arial,sans-serif"><img src="https://vednemesicnik.cz/images/email-logo.png" width="36" height="36" alt="Vedneměsíčník"',
      ),
    )
  })

  it('asks for the „Souhlasím“ reply in a paragraph of its own', () => {
    let html = message().htmlBody
    assert.ok(html.includes('jediným slovem <strong>„Souhlasím“</strong>.</p>'))
    assert.ok(html.includes('">Takovou odpověď zpracujeme automaticky, jiné znění'))
  })

  it('sets no text or background colour, and frames the terms with a border alone', () => {
    let html = message().htmlBody
    assert.ok(!/[;"]color:/.test(html.replace(/<title>.*<\/title>/, '')))
    assert.ok(!/background/.test(html))
    assert.ok(html.includes('border:1px solid #6B7280;border-radius:8px;padding:16px'))
  })

  it('keeps every one-letter word of its own with the next, the terms included, and typed values as typed', () => {
    let sent = consentEmail({
      holder: { kind: 'article', name: 'Obědy v jídelně' },
      artworks: [
        {
          author: 'Jan z Brna',
          pdfHash: HASH,
          source: 'Archiv k výročí',
          storedName: `${'3'.repeat(64)}.jpg`,
        },
      ],
      attachments: [],
      formKey: 'form-1',
      issueName: 'VDM_2026_5',
      tag: '20261118T134500',
      to: 'jan.brna@external.test',
    })
    let html = sent.htmlBody
    assert.ok(
      !LOOSE_ONE_LETTER_WORD.test(
        ownText(html, ['Obědy v jídelně', 'Jan z Brna', 'Archiv k výročí']),
      ),
    )
    assert.ok(html.includes('k\u00a0užití výše uvedených děl'))
    assert.ok(html.includes('a\u00a0to v\u00a0tištěné i\u00a0digitální podobě'))
    assert.ok(html.includes('Autor: Jan z Brna'))
    assert.ok(html.includes('Zdroj: Archiv k výročí'))
    assert.ok(html.includes('Vedneměsíčník, z. s., IČO 22851356'))
    assert.ok(sent.subject.includes('ke článku „Obědy v jídelně“'))
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
    assert.ok(sent.htmlBody.includes('S\u00a0pozdravem'))
    assert.ok(
      sent.htmlBody.includes(
        'Tento e-mail jste obdrželi na základě adresy uvedené u\u00a0vašeho jména při založení článku.',
      ),
    )
    assert.ok(!sent.htmlBody.includes('studentské nekritické noviny'))
    assert.equal(sent.htmlBody.match(/[;"]color:(?!inherit)/g)?.length, 1)
    assert.ok(sent.htmlBody.includes('border:1px solid #cad5e2;color:inherit'))
  })

  it('names only the next steps and announces no later e-mail', () => {
    let html = welcomeEmail({
      articleName: 'Školní jídelna po roce',
      artworksUrl: 'https://publikace.vednemesicnik.test/l/AAAAAAAAAAAA/artworks',
      coauthors: [],
      documentUrl: 'https://docs.google.com/document/d/x/edit',
      formKey: 'form-1',
      issueName: 'VDM_2026_5',
      to: 'tereza.vlkova@external.test',
    }).htmlBody
    assert.ok(html.includes('Text pište přímo v\u00a0dokumentu Google.'))
    assert.ok(html.includes('Až bude text připravený ke korektuře, dejte prosím vědět šéfredakci.'))
    assert.ok(!html.includes('Souhlasím'))
    assert.ok(!html.includes('finální verzi'))
    assert.ok(!html.includes('Souhrnné upozornění'))
  })

  it('keeps every one-letter word of its own with the next, and the names as typed', () => {
    let sent = welcomeEmail({
      articleName: 'Obědy v jídelně',
      artworksUrl: 'https://publikace.vednemesicnik.test/l/AAAAAAAAAAAA/artworks',
      coauthors: ['Jan z Brna', 'Robin Malá'],
      documentUrl: 'https://docs.google.com/document/d/x/edit',
      formKey: 'form-1',
      issueName: 'VDM_2026_5',
      to: 'tereza.vlkova@external.test',
    })
    let html = sent.htmlBody
    assert.ok(!LOOSE_ONE_LETTER_WORD.test(ownText(html, ['Obědy v jídelně', 'Jan z Brna'])))
    assert.ok(html.includes('článek „Obědy v jídelně“ je zařazený'))
    assert.ok(html.includes('podílejí Jan z Brna a\u00a0Robin Malá.'))
    assert.ok(html.includes('Dotazy k\u00a0textu pište přímo do komentářů v\u00a0dokumentu.'))
    assert.equal(sent.subject, 'Článek „Obědy v jídelně“ je ve vydání VDM_2026_5')
  })
})
