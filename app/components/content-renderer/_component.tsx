import type { JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { renderToReactElement } from '@tiptap/static-renderer/pm/react'
import { clsx } from 'clsx'
import { BaseHyperlink } from '~/components/base-hyperlink'
import { Blockquote } from '~/components/blockquote'
import { BulletedList } from '~/components/bulleted-list'
import { Heading } from '~/components/heading'
import { Hyperlink } from '~/components/hyperlink'
import { ListItem } from '~/components/list-item'
import { NumberedList } from '~/components/numbered-list'
import { Paragraph } from '~/components/paragraph'
import { isExternalHref } from '~/utils/is-external-href'
import styles from './_styles.module.css'

type Props = {
  content: string | null
  className?: string
}

export function ContentRenderer({ content, className }: Props) {
  if (content === null) return null

  const parsedContent: JSONContent = JSON.parse(content)

  return (
    <div className={clsx(styles.container, className)}>
      {renderToReactElement({
        content: parsedContent,
        extensions: [StarterKit],
        options: {
          markMapping: {
            // A new tab and the icon only for links leaving the site (design
            // 12a); the stored target is ignored.
            link: ({ children, mark }) =>
              isExternalHref(mark.attrs.href) ? (
                <Hyperlink
                  href={mark.attrs.href}
                  rel={mark.attrs.rel}
                  target={'_blank'}
                >
                  {children}
                </Hyperlink>
              ) : (
                <BaseHyperlink href={mark.attrs.href} target={'_self'}>
                  {children}
                </BaseHyperlink>
              ),
          },
          nodeMapping: {
            blockquote: ({ children }) => <Blockquote>{children}</Blockquote>,
            bulletList: ({ children }) => (
              <BulletedList>{children}</BulletedList>
            ),
            heading: ({ children, node }) => (
              <Heading
                className={
                  node.attrs.level === 2 ? styles.heading2 : styles.heading3
                }
                level={node.attrs.level}
              >
                {children}
              </Heading>
            ),
            listItem: ({ children }) => <ListItem>{children}</ListItem>,
            orderedList: ({ children }) => (
              <NumberedList>{children}</NumberedList>
            ),
            paragraph: ({ children }) => <Paragraph>{children}</Paragraph>,
          },
        },
      })}
    </div>
  )
}
