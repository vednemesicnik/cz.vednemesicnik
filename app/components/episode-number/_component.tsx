import { clsx } from 'clsx'
import styles from './_styles.module.css'

type Props = {
  children: number
  className?: string
}

/**
 * A podcast episode's number before its title: `#11` in grey, read by screen
 * readers as *Epizoda 11* (design 13a, 13c, m18z9bn0). It keeps its own colour
 * inside a gradient headline. Follow it with a space before the title.
 *
 * @param children - The episode's number
 * @returns The number
 */
export const EpisodeNumber = ({ children, className }: Props) => {
  return (
    <span className={clsx(styles.number, className)}>
      <span aria-hidden={true}>#{children}</span>
      <span className={'screen-reader-only'}>Epizoda {children}</span>
    </span>
  )
}
