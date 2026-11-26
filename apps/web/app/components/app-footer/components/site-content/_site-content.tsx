import { BaseHyperlink } from '~/components/base-hyperlink'
import { BaseLink } from '~/components/base-link'
import { footerColumns } from '~/config/footer-links-config'
import styles from './_site-content.module.css'

export const SiteContent = () => {
  return (
    <div className={styles.container}>
      {footerColumns.map((column) => (
        <section className={styles.column} key={column.title}>
          <h2 className={styles.title}>{column.title}</h2>
          <ul className={styles.list}>
            {column.links.map((link) => (
              <li className={styles.listItem} key={link.label}>
                {link.kind === 'internal' ? (
                  <BaseLink className={styles.link} to={link.to}>
                    {link.label}
                  </BaseLink>
                ) : (
                  <BaseHyperlink className={styles.link} href={link.href}>
                    {link.label}
                  </BaseHyperlink>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

SiteContent.displayName = 'SiteContent'
