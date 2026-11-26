import { describe, expect, test } from 'vitest'

import { formatUnsavedPodcastAdvice } from './format-unsaved-podcast-advice'

const LEAD = 'Před otevřením detailu'

describe('formatUnsavedPodcastAdvice', () => {
  test('only the description: copy it', () => {
    expect(formatUnsavedPodcastAdvice(['Popis'], LEAD)).toEqual([
      'Před otevřením detailu si zkopírujte neuložený popis.',
    ])
  })

  test('only other values: note them', () => {
    expect(formatUnsavedPodcastAdvice(['Název', 'Adresa'], LEAD)).toEqual([
      'Před otevřením detailu si poznamenejte neuložené změny.',
    ])
  })

  test('the description and other values, before the current version', () => {
    expect(
      formatUnsavedPodcastAdvice(
        ['Název', 'Popis'],
        'Před načtením aktuální verze',
      ),
    ).toEqual([
      'Před načtením aktuální verze si zkopírujte neuložený popis a poznamenejte ostatní neuložené změny.',
    ])
  })

  test('a cover beside other values: the others, then pick the cover again', () => {
    expect(formatUnsavedPodcastAdvice(['Autor', 'Obálka'], LEAD)).toEqual([
      'Před otevřením detailu si poznamenejte ostatní neuložené změny.',
      'Až bude možné podcast znovu upravovat, vyberte soubor obálky znovu.',
    ])
  })

  test('nothing unsent: no advice', () => {
    expect(formatUnsavedPodcastAdvice([], LEAD)).toEqual([])
  })
})
