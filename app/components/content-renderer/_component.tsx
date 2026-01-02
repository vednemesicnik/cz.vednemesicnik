import type { JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { renderToReactElement } from '@tiptap/static-renderer/pm/react'
import { Blockquote } from '~/components/blockquote'
import { BulletedList } from '~/components/bulleted-list'
import { Heading } from '~/components/heading'
import { ListItem } from '~/components/list-item'
import { NumberedList } from '~/components/numbered-list'
import { Paragraph } from '~/components/paragraph'

type Props = {
  content: string
}

export function ContentRenderer({ content }: Props) {
  const parsedContent: JSONContent = JSON.parse(content)

  return renderToReactElement({
    content: parsedContent,
    extensions: [StarterKit],
    options: {
      nodeMapping: {
        blockquote: ({ children }) => <Blockquote>{children}</Blockquote>,
        bulletList: ({ children }) => <BulletedList>{children}</BulletedList>,
        heading: ({ children, node }) => (
          <Heading level={node.attrs.level}>{children}</Heading>
        ),
        listItem: ({ children }) => <ListItem>{children}</ListItem>,
        orderedList: ({ children }) => <NumberedList>{children}</NumberedList>,
        paragraph: ({ children }) => <Paragraph>{children}</Paragraph>,
      },
    },
  })
}
