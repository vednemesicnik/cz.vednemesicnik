type NumberedEpisode = {
  number: number | null
}

/**
 * Orders episodes as a bulk publish dates them (design 27b): the highest
 * number first, an episode without a number last. Ties keep their order, so
 * a stable sort over the table's rows (number, then newest) agrees with the
 * server, which breaks ties the same way.
 *
 * @param first - One episode.
 * @param second - The other.
 * @returns A negative number when `first` goes first.
 */
export const compareEpisodesByNumber = (
  first: NumberedEpisode,
  second: NumberedEpisode,
) =>
  (second.number ?? Number.NEGATIVE_INFINITY) -
  (first.number ?? Number.NEGATIVE_INFINITY)
