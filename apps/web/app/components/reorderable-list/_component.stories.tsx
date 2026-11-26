// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { ReorderableListHandle } from '~/components/reorderable-list-handle'
import { moveListItem } from '~/utils/move-list-item'

import { ReorderableList } from './_component'

const meta: Meta<typeof ReorderableList> = {
  component: ReorderableList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Primitives/ReorderableList',
}

export default meta
type Story = StoryObj<typeof meta>

const ARTICLES = [
  { id: 'a', title: 'Rozhovor s ředitelkou o nové budově' },
  { id: 'b', title: 'Co se změní na přijímačkách v roce 2027' },
  { id: 'c', title: 'Poslední slovo: co nám chybí po prázdninách' },
]

const rowStyle = {
  alignItems: 'center',
  border: '1px solid var(--border)',
  display: 'flex',
  fontSize: 'var(--font-size-sm)',
  gap: '10px',
  padding: '9px 12px',
}

/**
 * A row is dragged as a whole, or Tab to a handle — Space lifts and drops,
 * the arrows move, Escape puts it back (the bulk publish order, 22c).
 */
export const Playground: Story = {
  render: () => {
    const [items, setItems] = useState(ARTICLES)

    return (
      <div style={{ maxWidth: '412px' }}>
        <ReorderableList
          getName={(item) => item.title}
          instruction={
            'Mezerníkem článek zvednete i položíte, šipkami nahoru a dolů posunete a klávesou Escape přesun zrušíte.'
          }
          items={items}
          onReorder={(from, to) =>
            setItems((current) => moveListItem(current, from, to))
          }
        >
          {({ item }) => (
            <div style={rowStyle}>
              <ReorderableListHandle
                label={`Přesunout článek: ${item.title}`}
              />
              {item.title}
            </div>
          )}
        </ReorderableList>
      </div>
    )
  },
}

const LINKS = [
  { id: 'spotify', label: 'Spotify' },
  { id: 'apple', label: 'Apple Podcasts' },
]

/**
 * Rows with fields drag only from the handle, so a press in a field types
 * and a finger still scrolls the page (the episode's links, 27d).
 */
export const RowsWithFields: Story = {
  render: () => {
    const [items, setItems] = useState(LINKS)

    return (
      <div style={{ maxWidth: '520px' }}>
        <ReorderableList
          dragArea={'handle'}
          getName={(item) => item.label}
          instruction={
            'Mezerníkem odkaz zvednete i položíte, šipkami nahoru a dolů posunete a klávesou Escape přesun zrušíte.'
          }
          items={items}
          onReorder={(from, to) =>
            setItems((current) => moveListItem(current, from, to))
          }
        >
          {({ item, index, count }) => (
            <div style={rowStyle}>
              <ReorderableListHandle
                label={`Přesunout odkaz: ${item.label}. Pozice ${index + 1}, celkem ${count}.`}
              />
              <input aria-label={'Název platformy'} defaultValue={item.label} />
            </div>
          )}
        </ReorderableList>
      </div>
    )
  },
}
