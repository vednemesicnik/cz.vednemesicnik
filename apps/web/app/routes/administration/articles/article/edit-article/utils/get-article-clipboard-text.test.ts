import { describe, expect, test } from 'vitest'

import { getArticleClipboardText } from './get-article-clipboard-text'

const content = JSON.stringify({
  content: [
    {
      attrs: { level: 2 },
      content: [{ text: 'Deset knih', type: 'text' }],
      type: 'heading',
    },
    {
      content: [
        { text: 'Na podzim čteme ', type: 'text' },
        { marks: [{ type: 'bold' }], text: 'pomalu', type: 'text' },
      ],
      type: 'paragraph',
    },
    {
      content: [
        {
          content: [
            { content: [{ text: 'Babička', type: 'text' }], type: 'paragraph' },
          ],
          type: 'listItem',
        },
      ],
      type: 'bulletList',
    },
  ],
  type: 'doc',
})

describe('getArticleClipboardText', () => {
  test('HTML keeps the structure and the marks', () => {
    const { html } = getArticleClipboardText(content)

    expect(html).toContain('<h2>Deset knih</h2>')
    expect(html).toContain('<strong>pomalu</strong>')
    expect(html).toContain('<li><p>Babička</p></li>')
  })

  test('plain text keeps the blocks apart', () => {
    expect(getArticleClipboardText(content).text).toBe(
      'Deset knih\n\nNa podzim čteme pomalu\n\nBabička',
    )
  })

  test('an empty text copies nothing', () => {
    expect(getArticleClipboardText('')).toEqual({ html: '', text: '' })
  })
})
