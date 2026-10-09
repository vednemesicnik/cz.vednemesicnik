import { clsx } from 'clsx'
import type { ComponentProps, ReactNode } from 'react'
import { Link } from '~/components/link'
import styles from './_styles.module.css'

type LinkStripItem = {
  label: string
  to: ComponentProps<typeof Link>['to']
}

type Props = {
  children: ReactNode
  className?: string
  links?: LinkStripItem[]
  more: LinkStripItem
}

/**
 * A tinted strip leading from one index to another, below its list: a short
 * sentence, optional example links and a trailing "… →" link (design 11c).
 *
 * @param children - The sentence ("Články mají i štítky, třeba")
 * @param links - Example links shown after the sentence
 * @param more - The trailing link to the other index; its arrow is hidden from screen readers
 * @returns The strip
 */
export const LinkStrip = ({ children, className, links, more }: Props) => {
  return (
    <aside className={clsx(styles.strip, className)}>
      <span className={styles.text}>{children}</span>
      {links && links.length > 0 && (
        <span className={styles.links}>
          {links.map((link) => (
            <Link key={link.label} to={link.to}>
              {link.label}
            </Link>
          ))}
        </span>
      )}
      <Link className={styles.more} to={more.to}>
        {more.label} <span aria-hidden={true}>→</span>
      </Link>
    </aside>
  )
}
