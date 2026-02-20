import { clsx } from 'clsx'
import { KeyboardArrowLeftIcon } from '~/components/icons/keyboard-arrow-left-icon'
import { KeyboardArrowRightIcon } from '~/components/icons/keyboard-arrow-right-icon'
import { Link } from '~/components/link'
import styles from './_styles.module.css'

export const PAGE_PARAM = 'page'

type Props = {
  currentPage: number
  pageSize: number
  totalCount: number
  totalPages: number
}

function getPageLink(page: number) {
  return page === 1 ? { search: '' } : { search: `?${PAGE_PARAM}=${page}` }
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

export const Pagination = ({
  currentPage,
  pageSize,
  totalCount,
  totalPages,
}: Props) => {
  if (totalPages <= 1) return null

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
              className={styles.item}
              to={getPageLink(currentPage - 1)}
            >
              <span aria-hidden={true} className={styles.itemIcon}>
                <KeyboardArrowLeftIcon />
              </span>
              <span aria-hidden={true} className={styles.itemLabel}>
                Zpět
              </span>
            </Link>
          ) : (
            <span className={clsx(styles.item, styles.disabled)}>
              <span className={styles.srOnly}>Předchozí stránka</span>
              <span aria-hidden={true} className={styles.itemIcon}>
                <KeyboardArrowLeftIcon />
              </span>
              <span aria-hidden={true} className={styles.itemLabel}>
                Zpět
              </span>
            </span>
          )}
        </li>
        {pageNumbers.map((page, index) =>
          page === 'ellipsis' ? (
            <li
              aria-hidden={true}
              className={styles.ellipsis}
              key={`ellipsis-${index}`}
            >
              …
            </li>
          ) : page === currentPage ? (
            <li key={page}>
              <span
                aria-current={'page'}
                className={clsx(styles.item, styles.current)}
              >
                <span className={styles.srOnly}>Stránka </span>
                {page}
              </span>
            </li>
          ) : (
            <li key={page}>
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
              className={styles.item}
              to={getPageLink(currentPage + 1)}
            >
              <span aria-hidden={true} className={styles.itemLabel}>
                Další
              </span>
              <span aria-hidden={true} className={styles.itemIcon}>
                <KeyboardArrowRightIcon />
              </span>
            </Link>
          ) : (
            <span className={clsx(styles.item, styles.disabled)}>
              <span className={styles.srOnly}>Další stránka</span>
              <span aria-hidden={true} className={styles.itemLabel}>
                Další
              </span>
              <span aria-hidden={true} className={styles.itemIcon}>
                <KeyboardArrowRightIcon />
              </span>
            </span>
          )}
        </li>
      </ul>
      <p aria-live={'polite'} className={styles.summary}>
        {startItem.toLocaleString('cs-CZ')}–{endItem.toLocaleString('cs-CZ')} z{' '}
        {totalCount.toLocaleString('cs-CZ')}
      </p>
    </nav>
  )
}
