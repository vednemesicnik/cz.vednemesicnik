import { useEffect, useState } from 'react'
import { getCurrentYear } from './get-current-year'

// A jump to `#2012` rests the heading at its scroll margin; a few pixels of
// slack count it as passed.
const PASS_SLACK = 4

const getIsAtEnd = () =>
  window.scrollY > 0 &&
  window.scrollY + window.innerHeight >=
    document.documentElement.scrollHeight - 1

/**
 * The year the reader is at on `/archive`, for the year bar's `NavRow`
 * (14a, d104jrnd). An `IntersectionObserver` notices the year headings cross
 * the line where a jump stops them, their scroll margin, and then every
 * heading is measured against it; the page's end is read on scroll.
 *
 * @param years - The years in page order; each heading's `id` is its year
 * @returns The current year, the first one before hydration
 */
export const useCurrentYear = (years: number[]): number | undefined => {
  const [passedYears, setPassedYears] = useState<ReadonlySet<number>>(
    () => new Set(),
  )
  const [isAtEnd, setIsAtEnd] = useState(false)

  useEffect(() => {
    const headings = years.flatMap((year) => {
      const heading = document.getElementById(String(year))

      return heading === null ? [] : [heading]
    })

    if (headings.length === 0) return

    let observer: IntersectionObserver | undefined
    let line = Number.NaN

    // The line follows the header's height, which changes with the width.
    const observe = () => {
      const nextLine =
        Number.parseFloat(getComputedStyle(headings[0]).scrollMarginTop) +
        PASS_SLACK

      if (nextLine === line) return

      line = nextLine
      observer?.disconnect()
      observer = new IntersectionObserver(
        // Every heading is read again: one that jumps from above the line to
        // below the window never crosses it, so it reports no change.
        () => {
          const passed = headings.filter(
            (heading) => heading.getBoundingClientRect().top < line,
          )

          setPassedYears(new Set(passed.map(({ id }) => Number(id))))
        },
        { rootMargin: `-${line}px 0px 0px 0px`, threshold: [0, 1] },
      )

      for (const heading of headings) observer.observe(heading)
    }

    const handleScroll = () => setIsAtEnd(getIsAtEnd())

    observe()
    handleScroll()
    window.addEventListener('resize', observe)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', observe)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [years])

  return getCurrentYear({ isAtEnd, passedYears, years })
}
