type Options = {
  isAtEnd: boolean
  passedYears: ReadonlySet<number>
  years: number[]
}

/**
 * The year the reader is at on `/archive` (14a, d104jrnd): the one whose
 * heading last passed under the year bar, the first year at the top of the
 * page. At the page's end the last year, whose heading may never reach the bar
 * when its covers are shorter than the window.
 *
 * @param options.years - The years in page order
 * @param options.passedYears - The years whose heading has passed under the bar
 * @param options.isAtEnd - Whether the page is scrolled to its end
 * @returns The current year, or `undefined` without years
 */
export const getCurrentYear = ({
  isAtEnd,
  passedYears,
  years,
}: Options): number | undefined => {
  if (isAtEnd) return years.at(-1)

  const passed = years.filter((year) => passedYears.has(year))

  return passed.at(-1) ?? years.at(0)
}
