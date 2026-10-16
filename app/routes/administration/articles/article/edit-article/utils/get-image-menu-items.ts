type Options = {
  index: number
  count: number
  isFeatured: boolean
  onFeature: () => void
  onUnfeature: () => void
  onMove: (to: number) => void
  onReplace: () => void
  onRemove: () => void
}

/**
 * A stored image tile's „⋯“ (design 24b, 8kfn4ou3): the main image, a step
 * forward or back only where there is one, *Nahradit soubor*, then *Odebrat*.
 *
 * @param options - The tile's place, whether it is the main image, and the
 *   actions.
 * @returns The `ActionMenu` items.
 */
export const getImageMenuItems = ({
  index,
  count,
  isFeatured,
  onFeature,
  onUnfeature,
  onMove,
  onReplace,
  onRemove,
}: Options) => [
  isFeatured
    ? { label: 'Zrušit jako hlavní', onSelect: onUnfeature }
    : { label: 'Nastavit jako hlavní', onSelect: onFeature },
  ...(index > 0
    ? [{ label: 'Posunout dopředu', onSelect: () => onMove(index - 1) }]
    : []),
  ...(index < count - 1
    ? [{ label: 'Posunout dozadu', onSelect: () => onMove(index + 1) }]
    : []),
  { label: 'Nahradit soubor', onSelect: onReplace },
  { danger: true, label: 'Odebrat', onSelect: onRemove },
]
