import { describe, expect, it } from 'vitest'
import { pickTopByArticleCount } from './pick-top-by-article-count'

const item = (name: string, articleCount: number) => ({ articleCount, name })

describe('pickTopByArticleCount', () => {
  it('keeps the items with the most articles, ordered by name', () => {
    const items = [
      item('Sport', 2),
      item('Kultura', 18),
      item('Škola', 14),
      item('Ankety', 4),
      item('Rozhovor', 11),
      item('Reportáž', 9),
    ]

    expect(
      pickTopByArticleCount(items, 5).map((picked) => picked.name),
    ).toEqual(['Ankety', 'Kultura', 'Reportáž', 'Rozhovor', 'Škola'])
  })

  it('breaks a tie at the cut by name', () => {
    const items = [item('Cestování', 3), item('Byznys', 3), item('Archiv', 3)]

    expect(
      pickTopByArticleCount(items, 2).map((picked) => picked.name),
    ).toEqual(['Archiv', 'Byznys'])
  })

  it('returns everything when there are fewer items than the limit', () => {
    expect(pickTopByArticleCount([item('Kultura', 1)], 5)).toEqual([
      item('Kultura', 1),
    ])
  })

  it('does not mutate the input', () => {
    const items = [item('B', 1), item('A', 2)]
    pickTopByArticleCount(items, 1)

    expect(items).toEqual([item('B', 1), item('A', 2)])
  })
})
