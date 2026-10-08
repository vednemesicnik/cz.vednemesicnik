import type { Mark, Node } from '@tiptap/pm/model'
import type { JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { renderToReactElement } from '@tiptap/static-renderer/pm/react'
import { clsx } from 'clsx'
import type { ReactNode } from 'react'
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
import { groupLinkRuns } from './utils/group-link-runs'

type Props = {
  content: string | null
  className?: string
}

type ContentLinkProps = {
  mark: Mark
  children?: ReactNode
}

// A new tab and the icon only for links leaving the site (design 12a); the
// stored target is ignored.
const ContentLink = ({ mark, children }: ContentLinkProps) =>
  isExternalHref(mark.attrs.href) ? (
    <Hyperlink href={mark.attrs.href} rel={mark.attrs.rel} target={'_blank'}>
      {children}
    </Hyperlink>
  ) : (
    <BaseHyperlink href={mark.attrs.href} target={'_self'}>
      {children}
    </BaseHyperlink>
  )

type TextblockProps = {
  node: Node
  renderElement: (props: { content: Node; parent?: Node }) => ReactNode
}

// The static renderer applies marks per text node, so a link with a bold word
// inside would render as several anchors, each with its own icon. Render one
// anchor per run of nodes sharing the same link instead.
const renderTextblockContent = ({ node, renderElement }: TextblockProps) =>
  groupLinkRuns(node).flatMap((run, index) => {
    const children = run.nodes.map((child) =>
      renderElement({ content: child, parent: node }),
    )

    return run.link === null ? (
      children
    ) : (
      <ContentLink key={`link-${index}`} mark={run.link}>
        {children}
      </ContentLink>
    )
  })

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
            link: ({ children, mark }) => (
              <ContentLink mark={mark}>{children}</ContentLink>
            ),
          },
          nodeMapping: {
            blockquote: ({ children }) => <Blockquote>{children}</Blockquote>,
            bulletList: ({ children }) => (
              <BulletedList>{children}</BulletedList>
            ),
            heading: ({ node, renderElement }) => (
              <Heading
                className={
                  node.attrs.level === 2 ? styles.heading2 : styles.heading3
                }
                level={node.attrs.level}
              >
                {renderTextblockContent({ node, renderElement })}
              </Heading>
            ),
            listItem: ({ children }) => <ListItem>{children}</ListItem>,
            orderedList: ({ children }) => (
              <NumberedList>{children}</NumberedList>
            ),
            paragraph: ({ node, renderElement }) => (
              <Paragraph>
                {renderTextblockContent({ node, renderElement })}
              </Paragraph>
            ),
          },
        },
      })}
    </div>
  )
}
