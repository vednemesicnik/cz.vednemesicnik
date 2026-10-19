type Options = {
  /** The tile's place among the stored images. */
  index: number
  count: number
  isFeatured: boolean
  /** The article has a main image, which stands first and stays there. */
  hasFeatured: boolean
  onFeature: () => void
  onUnfeature: () => void
  onMove: (to: number) => void
  onReplace: () => void
  onRemove: () => void
}

/**
 * A stored image tile's „⋯“ (design 24b, 8kfn4ou3): the main image, a step
 * forward or back only where there is one, *Nahradit soubor*, then *Odebrat*.
 * The main image stands first and does not move, so nothing moves before it
 * either (yj2t50dd).
 *
 * @param options - The tile's place, whether it or another is the main image,
 *   and the actions.
 * @returns The `ActionMenu` items.
 */
export const getImageMenuItems = ({
  index,
  count,
  isFeatured,
  hasFeatured,
  onFeature,
  onUnfeature,
  onMove,
  onReplace,
  onRemove,
}: Options) => {
  const firstMovable = hasFeatured ? 1 : 0
  const canMove = !isFeatured

  return [
    isFeatured
      ? { label: 'Zrušit jako hlavní', onSelect: onUnfeature }
      : { label: 'Nastavit jako hlavní', onSelect: onFeature },
    ...(canMove && index > firstMovable
      ? [{ label: 'Posunout dopředu', onSelect: () => onMove(index - 1) }]
      : []),
    ...(canMove && index < count - 1
      ? [{ label: 'Posunout dozadu', onSelect: () => onMove(index + 1) }]
      : []),
    { label: 'Nahradit soubor', onSelect: onReplace },
    { danger: true, label: 'Odebrat', onSelect: onRemove },
  ]
}
