import { describe, expect, test, vi } from 'vitest'

import { getImageMenuItems } from './get-image-menu-items'

const actions = {
  onFeature: vi.fn(),
  onMove: vi.fn(),
  onRemove: vi.fn(),
  onReplace: vi.fn(),
  onUnfeature: vi.fn(),
}

const labels = (index: number, count: number, isFeatured = false) =>
  getImageMenuItems({ ...actions, count, index, isFeatured }).map(
    (item) => item.label,
  )

describe('getImageMenuItems (design 24b, 8kfn4ou3)', () => {
  test('the first image moves only back', () => {
    expect(labels(0, 3)).toEqual([
      'Nastavit jako hlavní',
      'Posunout dozadu',
      'Nahradit soubor',
      'Odebrat',
    ])
  })

  test('the last image moves only forward', () => {
    expect(labels(2, 3)).toContain('Posunout dopředu')
    expect(labels(2, 3)).not.toContain('Posunout dozadu')
  })

  test('a single image moves nowhere', () => {
    expect(labels(0, 1)).not.toContain('Posunout dopředu')
    expect(labels(0, 1)).not.toContain('Posunout dozadu')
  })

  test('the main image offers to stop being it', () => {
    expect(labels(1, 3, true)[0]).toBe('Zrušit jako hlavní')
  })

  test('a step moves by one place', () => {
    const items = getImageMenuItems({
      ...actions,
      count: 3,
      index: 1,
      isFeatured: false,
    })
    items.find((item) => item.label === 'Posunout dopředu')?.onSelect()
    expect(actions.onMove).toHaveBeenLastCalledWith(0)
    items.find((item) => item.label === 'Posunout dozadu')?.onSelect()
    expect(actions.onMove).toHaveBeenLastCalledWith(2)
  })

  test('Odebrat is the last, destructive item', () => {
    const items = getImageMenuItems({
      ...actions,
      count: 2,
      index: 0,
      isFeatured: false,
    })
    expect(items.at(-1)).toMatchObject({ danger: true, label: 'Odebrat' })
  })
})
