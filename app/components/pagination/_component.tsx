import { clsx } from 'clsx'
import { useSearchParams } from 'react-router'
import { KeyboardArrowLeftIcon } from '~/components/icons/keyboard-arrow-left-icon'
import { KeyboardArrowRightIcon } from '~/components/icons/keyboard-arrow-right-icon'
import { Link } from '~/components/link'
import styles from './_styles.module.css'

export const PAGE_PARAM = 'page'

type Props = {
  currentPage: number
  noun: string
  pageSize: number
  totalCount: number
  totalPages: number
}

function getPageNumbers(
  currentPage: number,
  totalPages: number,
): (number | 'ellipsis')[] {
  const rangeStart = Math.max(2, currentPage - 1)
  const rangeEnd = Math.min(totalPages - 1, currentPage + 1)

  // Expand range by 1 when only a single page would be hidden by ellipsis
  const adjustedStart = rangeStart === 3 ? 2 : rangeStart
  const adjustedEnd = rangeEnd === totalPages - 2 ? totalPages - 1 : rangeEnd

  const pages: (number | 'ellipsis')[] = [1]

  if (adjustedStart > 2) pages.push('ellipsis')

  for (let i = adjustedStart; i <= adjustedEnd; i++) {
    pages.push(i)
  }

  if (adjustedEnd < totalPages - 1) pages.push('ellipsis')

  if (totalPages > 1) pages.push(totalPages)

  return pages
}

/**
 * Numbered pagination over `?page=` (design 11a, 11d). Below 640 px the page
 * numbers give way to "Stránka 2 z 6" between Předchozí and Další.
 *
 * @param noun - What the list counts, in the genitive plural ("článků"); it ends the summary "1–9 z 52 článků".
 * @returns The pagination, or nothing when everything fits on one page
 */
export const Pagination = ({
  currentPage,
  noun,
  pageSize,
  totalCount,
  totalPages,
}: Props) => {
  const [searchParams] = useSearchParams()

  if (totalPages <= 1) return null

  // Preserve unrelated query params (q, sort, order, ...) when changing pages.
  const getPageLink = (page: number) => {
    const params = new URLSearchParams(searchParams)

    if (page === 1) {
      params.delete(PAGE_PARAM)
    } else {
      params.set(PAGE_PARAM, String(page))
    }

    const search = params.toString()
    return { search: search ? `?${search}` : '' }
  }

  const pageNumbers = getPageNumbers(currentPage, totalPages)
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalCount)

  return (
    <nav aria-label={'Stránkování'} className={styles.pagination}>
      <ul className={styles.list}>
        <li>
          {currentPage > 1 ? (
            <Link
              aria-label={'Předchozí stránka'}
              className={clsx(styles.item, styles.step)}
              to={getPageLink(currentPage - 1)}
            >
              <span aria-hidden={true} className={styles.itemIcon}>
                <KeyboardArrowLeftIcon />
              </span>
              <span aria-hidden={true}>Předchozí</span>
            </Link>
          ) : (
            <span className={clsx(styles.item, styles.step, styles.disabled)}>
              <span className={styles.srOnly}>Předchozí stránka</span>
              <span aria-hidden={true} className={styles.itemIcon}>
                <KeyboardArrowLeftIcon />
              </span>
              <span aria-hidden={true}>Předchozí</span>
            </span>
          )}
        </li>
        <li className={styles.compact}>
          Stránka {currentPage} z {totalPages}
        </li>
        {pageNumbers.map((page, index) =>
          page === 'ellipsis' ? (
            <li
              aria-hidden={true}
              className={clsx(styles.ellipsis, styles.number)}
              key={`ellipsis-${index}`}
            >
              …
            </li>
          ) : page === currentPage ? (
            <li className={styles.number} key={page}>
              <span
                aria-current={'page'}
                className={clsx(styles.item, styles.current)}
              >
                <span className={styles.srOnly}>Stránka </span>
                {page}
              </span>
            </li>
          ) : (
            <li className={styles.number} key={page}>
              <Link className={styles.item} to={getPageLink(page)}>
                <span className={styles.srOnly}>Stránka </span>
                {page}
              </Link>
            </li>
          ),
        )}
        <li>
          {currentPage < totalPages ? (
            <Link
              aria-label={'Další stránka'}
              className={clsx(styles.item, styles.step)}
              to={getPageLink(currentPage + 1)}
            >
              <span aria-hidden={true}>Další</span>
              <span aria-hidden={true} className={styles.itemIcon}>
                <KeyboardArrowRightIcon />
              </span>
            </Link>
          ) : (
            <span className={clsx(styles.item, styles.step, styles.disabled)}>
              <span className={styles.srOnly}>Další stránka</span>
              <span aria-hidden={true}>Další</span>
              <span aria-hidden={true} className={styles.itemIcon}>
                <KeyboardArrowRightIcon />
              </span>
            </span>
          )}
        </li>
      </ul>
      <p aria-live={'polite'} className={styles.summary}>
        {startItem.toLocaleString('cs-CZ')}–{endItem.toLocaleString('cs-CZ')} z{' '}
        {totalCount.toLocaleString('cs-CZ')} {noun}
      </p>
    </nav>
  )
}
