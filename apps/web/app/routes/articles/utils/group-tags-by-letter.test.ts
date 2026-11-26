import { describe, expect, it } from 'vitest'
import { groupTagsByLetter } from './group-tags-by-letter'

const toTags = (names: string[]) => names.map((name) => ({ name }))

const toLetters = (names: string[]) =>
  groupTagsByLetter(toTags(names)).map((group) => [
    group.letter,
    group.tags.map((tag) => tag.name),
  ])

describe('groupTagsByLetter', () => {
  it('returns no groups for no tags', () => {
    expect(groupTagsByLetter([])).toEqual([])
  })

  it('puts tags starting with a digit into one 0–9 group first, numerically', () => {
    expect(toLetters(['absolventi', '2026-10', '2025-4', '2026-2'])).toEqual([
      ['0–9', ['2025-4', '2026-2', '2026-10']],
      ['A', ['absolventi']],
    ])
  })

  it('places CH after H and Š after S', () => {
    expect(
      toLetters(['školní ples', 'chemická olympiáda', 'spolek', 'hudba']),
    ).toEqual([
      ['H', ['hudba']],
      ['CH', ['chemická olympiáda']],
      ['S', ['spolek']],
      ['Š', ['školní ples']],
    ])
  })

  it('folds accents Czech folds and keeps the letters it does not', () => {
    expect(toLetters(['Ábel', 'čaj', 'cena', 'ďábel', 'auto'])).toEqual([
      ['A', ['Ábel', 'auto']],
      ['C', ['cena']],
      ['Č', ['čaj']],
      ['D', ['ďábel']],
    ])
  })

  it('uppercases the letter and keeps the original tag objects', () => {
    const tags = [{ id: 't1', name: 'maturita' }]

    expect(groupTagsByLetter(tags)).toEqual([{ letter: 'M', tags }])
  })
})
