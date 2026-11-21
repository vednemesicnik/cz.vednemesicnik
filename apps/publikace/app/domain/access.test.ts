import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import {
  addedMessage,
  administratorsSentence,
  checkAddress,
  checkProofreadersAddress,
  duplicateMessage,
  roleLostMessage,
} from './access.ts'

describe('checkAddress', () => {
  it('normalises an address on the domain', () => {
    assert.deepEqual(checkAddress('account', '  Eva@Vednemesicnik.test ', 'vednemesicnik.test'), {
      email: 'eva@vednemesicnik.test',
      ok: true,
    })
  })

  it('says nothing about the domain when the text is not an address at all', () => {
    assert.deepEqual(checkAddress('account', 'eva', 'vednemesicnik.test'), {
      message: 'Zadejte platnou e-mailovou adresu.',
      ok: false,
    })
  })

  it('has a sentence of its own for a group on another domain, where nobody signs in', () => {
    assert.deepEqual(checkAddress('account', 'eva@external.test', 'vednemesicnik.test'), {
      message: 'Zadejte adresu @vednemesicnik.test — jinou se přihlásit nelze.',
      ok: false,
    })
    assert.deepEqual(checkAddress('group', 'vybor@external.test', 'vednemesicnik.test'), {
      message: 'Zadejte adresu skupiny na doméně vednemesicnik.test.',
      ok: false,
    })
  })

  it('refuses everything when no domain is configured', () => {
    assert.equal(checkAddress('account', 'eva@vednemesicnik.test', '').ok, false)
  })
})

describe('the words of 14b', () => {
  it('names an account and a group in their own grammar', () => {
    assert.equal(
      duplicateMessage('account', 'eva@vednemesicnik.test'),
      'Účet eva@vednemesicnik.test už je přidaný.',
    )
    assert.equal(
      duplicateMessage('group', 'vybor@vednemesicnik.test'),
      'Skupina vybor@vednemesicnik.test už je přidaná.',
    )
    assert.equal(
      addedMessage('account', 'eva@vednemesicnik.test', null),
      'eva@vednemesicnik.test má přístup.',
    )
  })

  it('names an added group by its name in quotes, or by its address without one', () => {
    assert.equal(
      addedMessage('group', 'sefredakce@vednemesicnik.test', 'Šéfredakce 2026'),
      'Přidána skupina „Šéfredakce 2026“.',
    )
    assert.equal(
      addedMessage('group', 'vybor@vednemesicnik.test', null),
      'Přidána skupina vybor@vednemesicnik.test.',
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

describe('the proofreaders’ address (14f)', () => {
  it('takes an address on the domain, trimmed and lower-cased', () => {
    assert.deepEqual(
      checkProofreadersAddress(' Korektori@Vednemesicnik.test ', 'vednemesicnik.test'),
      {
        email: 'korektori@vednemesicnik.test',
        ok: true,
      },
    )
  })

  it('says what is wrong: nothing typed, not an address, another domain', () => {
    let message = (value: string) => {
      let check = checkProofreadersAddress(value, 'vednemesicnik.test')
      return check.ok ? null : check.message
    }
    assert.equal(message('  '), 'Zadejte adresu korektorů.')
    assert.equal(message('korektori'), 'Zadejte platnou e-mailovou adresu.')
    assert.equal(message('korektori@external.test'), 'Zadejte adresu na doméně vednemesicnik.test.')
  })
})
