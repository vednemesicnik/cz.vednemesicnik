type Keyed = {
  key: string
}

type Options<Item extends Keyed> = {
  shown: readonly Item[]
  fresh: readonly Item[]
  pinned: readonly Item[]
  appendsNew: boolean
}

/**
 * A dashboard section after a change elsewhere (design 22f, gl703egt): the
 * rows stay where they were, each with its new data, even one that left the
 * section; a row deleted meanwhile goes. In the queue, a newly submitted row
 * joins at the end, where the oldest-first order puts it anyway.
 *
 * @param options.shown - The rows on screen, in their order.
 * @param options.fresh - The section as the live load has it.
 * @param options.pinned - The rows on screen as the live load has them,
 *   wherever they are now.
 * @param options.appendsNew - Whether a row new to the section joins at its
 *   end (the queue does).
 * @returns The section's rows to show.
 */
export const composeLiveSection = <Item extends Keyed>({
  shown,
  fresh,
  pinned,
  appendsNew,
}: Options<Item>): Item[] => {
  const latest = new Map(
    [...pinned, ...fresh].map((item) => [item.key, item] as const),
  )
  const shownKeys = new Set(shown.map((item) => item.key))

  return [
    ...shown.flatMap((item) => latest.get(item.key) ?? []),
    ...(appendsNew ? fresh.filter((item) => !shownKeys.has(item.key)) : []),
  ]
}
