import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import {
  addedMessage,
  administratorsSentence,
  checkAddress,
  duplicateMessage,
  roleLostMessage,
} from './access.ts'

describe('checkAddress', () => {
  it('normalises an address on the domain', () => {
    assert.deepEqual(checkAddress('account', '  Eva@Priklad.cz ', 'priklad.cz'), {
      email: 'eva@priklad.cz',
      ok: true,
    })
  })

  it('says nothing about the domain when the text is not an address at all', () => {
    assert.deepEqual(checkAddress('account', 'eva', 'priklad.cz'), {
      message: 'Zadejte platnou e-mailovou adresu.',
      ok: false,
    })
  })

  it('has a sentence of its own for a group on another domain, where nobody signs in', () => {
    assert.deepEqual(checkAddress('account', 'eva@jinde.cz', 'priklad.cz'), {
      message: 'Zadejte adresu @priklad.cz — jinou se přihlásit nelze.',
      ok: false,
    })
    assert.deepEqual(checkAddress('group', 'vybor@jinde.cz', 'priklad.cz'), {
      message: 'Zadejte adresu skupiny na doméně priklad.cz.',
      ok: false,
    })
  })

  it('refuses everything when no domain is configured', () => {
    assert.equal(checkAddress('account', 'eva@priklad.cz', '').ok, false)
  })
})

describe('the words of 14b', () => {
  it('names an account and a group in their own grammar', () => {
    assert.equal(
      duplicateMessage('account', 'eva@priklad.cz'),
      'Účet eva@priklad.cz už je přidaný.',
    )
    assert.equal(
      duplicateMessage('group', 'vybor@priklad.cz'),
      'Skupina vybor@priklad.cz už je přidaná.',
    )
    assert.equal(addedMessage('account', 'eva@priklad.cz'), 'eva@priklad.cz má přístup.')
    assert.equal(
      addedMessage('group', 'vybor@priklad.cz'),
      'Členové skupiny vybor@priklad.cz mají přístup.',
    )
  })

  it('puts the administrators sentence and the Callout in the same number', () => {
    assert.equal(
      administratorsSentence(['Marie Horáková']),
      'Přístup mění správce: Marie Horáková.',
    )
    assert.equal(
      roleLostMessage(1),
      'Obraťte se na správce uvedeného níže. Změna se neuložila, protože už nemáte roli správce.',
    )
    assert.equal(
      administratorsSentence(['Marie Horáková', 'Jakub Novák']),
      'Přístup mění správci: Marie Horáková, Jakub Novák.',
    )
    assert.equal(
      roleLostMessage(2),
      'Obraťte se na správce uvedené níže. Změna se neuložila, protože už nemáte roli správce.',
    )
  })
})
