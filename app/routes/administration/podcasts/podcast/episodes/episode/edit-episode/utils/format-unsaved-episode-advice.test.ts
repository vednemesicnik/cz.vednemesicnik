import { describe, expect, test } from 'vitest'

import { formatUnsavedEpisodeAdvice } from './format-unsaved-episode-advice'

const LEAD = 'Před otevřením detailu'

describe('formatUnsavedEpisodeAdvice', () => {
  test('only the description: copy it', () => {
    expect(formatUnsavedEpisodeAdvice(['Popis'], LEAD)).toEqual([
      'Před otevřením detailu si zkopírujte neuložený popis.',
    ])
  })

  test('only other values: note them', () => {
    expect(formatUnsavedEpisodeAdvice(['Název', 'Číslo'], LEAD)).toEqual([
      'Před otevřením detailu si poznamenejte neuložené změny.',
    ])
  })

  test('the description and other values: copy and note', () => {
    expect(
      formatUnsavedEpisodeAdvice(
        ['Popis', 'Odkazy na epizodu'],
        'Před načtením aktuální verze',
      ),
    ).toEqual([
      'Před načtením aktuální verze si zkopírujte neuložený popis a poznamenejte ostatní neuložené změny.',
    ])
  })

  test('a cover beside other values: the others, then pick the cover again', () => {
    expect(formatUnsavedEpisodeAdvice(['Adresa', 'Obálka'], LEAD)).toEqual([
      'Před otevřením detailu si poznamenejte ostatní neuložené změny.',
      'Až bude možné epizodu znovu upravovat, vyberte soubor obálky znovu.',
    ])
  })

  test('only a cover: only pick it again', () => {
    expect(formatUnsavedEpisodeAdvice(['Obálka'], LEAD)).toEqual([
      'Až bude možné epizodu znovu upravovat, vyberte soubor obálky znovu.',
    ])
  })

  test('nothing unsent: no advice', () => {
    expect(formatUnsavedEpisodeAdvice([], LEAD)).toEqual([])
  })
})
