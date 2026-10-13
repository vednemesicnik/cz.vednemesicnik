// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { ReorderableList } from './_component'

const meta: Meta<typeof ReorderableList> = {
  component: ReorderableList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Administration/Articles/ReorderableList',
}

export default meta
type Story = StoryObj<typeof meta>

const ITEMS = [
  {
    detail: 'Čeká na schválení',
    id: 'a',
    title: 'Rozhovor s ředitelkou o nové budově',
  },
  {
    detail: 'Koncept',
    id: 'b',
    title: 'Co se změní na přijímačkách v roce 2027',
  },
  {
    detail: 'Schváleno',
    id: 'c',
    title: 'Poslední slovo: co nám chybí po prázdninách',
  },
]

/**
 * The bulk publish order (22c): drag a row, or Tab to a handle — Space lifts
 * and drops, the arrows move, Escape puts it back.
 */
export const Playground: Story = {
  args: { items: ITEMS, onReorder: () => {} },
  render: (args) => {
    const [items, setItems] = useState(args.items)

    return (
      <div style={{ maxWidth: '412px' }}>
        <ReorderableList items={items} onReorder={setItems} />
      </div>
    )
  },
}
