import { generateText, type JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { renderToHTMLString } from '@tiptap/static-renderer/pm/html-string'

/**
 * The article's text for *Zkopírovat celý text* (design 24h, 24i): the whole
 * text as the editor holds it, saved or not, without the title, the perex or
 * any other field. HTML keeps headings, lists and links where the paste goes
 * into a rich editor; plain text keeps paragraphs apart everywhere else.
 *
 * @param content - The editor's field value: Tiptap JSON, or `''` when empty.
 * @returns `{ html, text }`, both empty for an empty text.
 */
export const getArticleClipboardText = (content: string) => {
  if (content === '') return { html: '', text: '' }

  const document: JSONContent = JSON.parse(content)

  return {
    html: renderToHTMLString({ content: document, extensions: [StarterKit] }),
    // Nested blocks (a list's items) would add a separator per level.
    text: generateText(document, [StarterKit], {
      blockSeparator: '\n\n',
    }).replace(/\n{3,}/g, '\n\n'),
  }
}
