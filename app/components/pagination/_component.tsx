import { clsx } from 'clsx'
import { Link } from '~/components/link'
import styles from './_styles.module.css'

interface Props {
  currentPage: number
  totalPages: number
}

export const Pagination = ({ currentPage, totalPages }: Props) => {
  if (totalPages <= 1) return null

  return (
    <nav className={styles.pagination}>
      {currentPage > 1 ? (
        <Link
          className={styles.previous}
          to={
            currentPage - 1 === 1
              ? { search: '' }
              : { search: `?page=${currentPage - 1}` }
          }
        >
          Předchozí
        </Link>
      ) : (
        <span className={clsx(styles.disabled, styles.previous)}>
          Předchozí
        </span>
      )}
      <span className={styles.info}>
        Stránka {currentPage} z {totalPages}
      </span>
      {currentPage < totalPages ? (
        <Link
          className={styles.next}
          to={{ search: `?page=${currentPage + 1}` }}
        >
          Další
        </Link>
      ) : (
        <span className={clsx(styles.disabled, styles.next)}>Další</span>
      )}
    </nav>
  )
}
