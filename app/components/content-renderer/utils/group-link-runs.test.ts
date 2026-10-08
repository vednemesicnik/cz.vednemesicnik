import { getSchema, type JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { describe, expect, test } from 'vitest'

import { groupLinkRuns } from '~/components/content-renderer/utils/group-link-runs'

const schema = getSchema([StarterKit])

const link = (href: string) => ({ attrs: { href }, type: 'link' })
const bold = { type: 'bold' }

const paragraph = (content: JSONContent[]) =>
  schema.nodeFromJSON({ content, type: 'paragraph' })

const describeRuns = (content: JSONContent[]) =>
  groupLinkRuns(paragraph(content)).map((run) => ({
    href: run.link?.attrs.href ?? null,
    nodes: run.nodes.map((node) => ({
      marks: node.marks.map((mark) => mark.type.name),
      text: node.text,
    })),
  }))

describe('groupLinkRuns', () => {
  test('one link split by an inner mark is one run without the link mark', () => {
    expect(
      describeRuns([
        { text: 'Viz ', type: 'text' },
        {
          marks: [link('https://priklad.cz/a')],
          text: 'odkaz s ',
          type: 'text',
        },
        {
          marks: [bold, link('https://priklad.cz/a')],
          text: 'tučnou',
          type: 'text',
        },
        { marks: [link('https://priklad.cz/a')], text: ' částí', type: 'text' },
        { text: '.', type: 'text' },
      ]),
    ).toEqual([
      { href: null, nodes: [{ marks: [], text: 'Viz ' }] },
      {
        href: 'https://priklad.cz/a',
        nodes: [
          { marks: [], text: 'odkaz s ' },
          { marks: ['bold'], text: 'tučnou' },
          { marks: [], text: ' částí' },
        ],
      },
      { href: null, nodes: [{ marks: [], text: '.' }] },
    ])
  })

  test('adjacent links with different attributes stay separate runs', () => {
    expect(
      describeRuns([
        { marks: [link('https://priklad.cz/a')], text: 'první', type: 'text' },
        { marks: [link('https://priklad.cz/b')], text: 'druhý', type: 'text' },
      ]).map((run) => run.href),
    ).toEqual(['https://priklad.cz/a', 'https://priklad.cz/b'])
  })

  test('the same link interrupted by plain text is two runs', () => {
    expect(
      describeRuns([
        { marks: [link('https://priklad.cz/a')], text: 'první', type: 'text' },
        { text: ' a ', type: 'text' },
        { marks: [link('https://priklad.cz/a')], text: 'druhý', type: 'text' },
      ]).map((run) => run.href),
    ).toEqual(['https://priklad.cz/a', null, 'https://priklad.cz/a'])
  })

  test('unlinked inline nodes form one run', () => {
    expect(
      describeRuns([
        { text: 'řádek', type: 'text' },
        { type: 'hardBreak' },
        { marks: [bold], text: 'další', type: 'text' },
      ]),
    ).toEqual([
      {
        href: null,
        nodes: [
          { marks: [], text: 'řádek' },
          { marks: [], text: undefined },
          { marks: ['bold'], text: 'další' },
        ],
      },
    ])
  })
})
