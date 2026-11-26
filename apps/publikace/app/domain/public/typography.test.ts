import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { keepOneLetterWords, tied } from './typography.ts'

describe('keepOneLetterWords', () => {
  it('ties a one-letter preposition or conjunction to the word after it', () => {
    assert.equal(keepOneLetterWords('Text pište v dokumentu.'), 'Text pište v\u00a0dokumentu.')
    assert.equal(keepOneLetterWords('S pozdravem'), 'S\u00a0pozdravem')
    assert.equal(keepOneLetterWords('k užití díla'), 'k\u00a0užití díla')
  })

  it('ties each word of a run', () => {
    assert.equal(
      keepOneLetterWords('jazykovými a v tištěné i digitální'),
      'jazykovými a\u00a0v\u00a0tištěné i\u00a0digitální',
    )
  })

  it('ties a word after an opening quote or a bracket', () => {
    assert.equal(keepOneLetterWords('„o čem“ (a proč)'), '„o\u00a0čem“ (a\u00a0proč)')
  })

  it('leaves an abbreviation and the end of a longer word alone', () => {
    assert.equal(keepOneLetterWords('Vedneměsíčník, z. s. IČO'), 'Vedneměsíčník, z. s. IČO')
    assert.equal(keepOneLetterWords('vás prosíme'), 'vás prosíme')
    assert.equal(keepOneLetterWords('Lucemburk v Praze'), 'Lucemburk v\u00a0Praze')
  })

  it('changes nothing that is tied already', () => {
    let tied = keepOneLetterWords('v dokumentu u vašeho jména')
    assert.equal(keepOneLetterWords(tied), tied)
  })
})

describe('tied', () => {
  it('ties the template’s own text', () => {
    assert.equal(tied`Část souborů už může být v koši.`, 'Část souborů už může být v koši.')
  })

  it('puts a value in as typed and ties the word before it', () => {
    let title = 'Výstava v Brně a jinde'
    assert.equal(
      tied`Díla k článku „${title}“ i PDF`,
      'Díla k článku „Výstava v Brně a jinde“ i PDF',
    )
    assert.equal(tied`Soubor v ${title}`, 'Soubor v Výstava v Brně a jinde')
  })

  it('does not take a letter glued to a value for a word', () => {
    assert.equal(tied`${'Jan'}a k textu`, 'Jana k textu')
    assert.equal(tied`${'Jan'} a k textu`, 'Jan a k textu')
  })

  it('gives what keepOneLetterWords leaves alone', () => {
    let text = tied`Text pište v dokumentu, ${'z. s.'} u vás`
    assert.equal(keepOneLetterWords(text), text)
  })
})
