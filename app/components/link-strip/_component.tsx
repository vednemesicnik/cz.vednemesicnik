import { clsx } from 'clsx'
import type { ComponentProps, ReactNode } from 'react'
import { Link } from '~/components/link'
import { LinkArrow } from '~/components/link-arrow'
import styles from './_styles.module.css'

type LinkStripItem = {
  /** Something the reader doesn't see: a frame on the link's own edge (11e). */
  isPreview?: boolean
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
            <Link
              className={clsx(link.isPreview && styles.preview)}
              key={link.label}
              to={link.to}
            >
              {link.label}
            </Link>
          ))}
        </span>
      )}
      <Link className={styles.more} to={more.to}>
        {more.label}
        <LinkArrow />
      </Link>
    </aside>
  )
}
