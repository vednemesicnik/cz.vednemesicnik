// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { within } from 'storybook/test'

import { Chip } from '~/components/chip'
import { foldForSearch } from '~/utils/fold-for-search'

import { ChipInput } from './_component'

const TAGS = [
  { label: 'čtení', value: 'cteni' },
  { label: 'podzim', value: 'podzim' },
  { label: 'počasí', value: 'pocasi' },
  { label: 'prázdniny', value: 'prazdniny' },
  { label: 'škola', value: 'skola' },
  { label: 'sport', value: 'sport' },
]

type DemoProps = {
  initialValues: string[]
  initialQuery?: string
  archivedValues?: string[]
}

// The field with its chips and a search over the tags, as the editor uses it.
const ChipInputDemo = ({
  initialValues,
  initialQuery = '',
  archivedValues = [],
}: DemoProps) => {
  const [values, setValues] = useState(initialValues)
  const [query, setQuery] = useState(initialQuery)
  const foldedQuery = foldForSearch(query.trim())
  const options = TAGS.filter(
    (tag) =>
      !values.includes(tag.value) &&
      !archivedValues.includes(tag.value) &&
      foldForSearch(tag.label).includes(foldedQuery),
  )

  return (
    <div style={{ width: '300px' }}>
      <ChipInput
        id={'tags'}
        label={'Štítky'}
        onQueryChange={setQuery}
        onRemoveLast={() => setValues(values.slice(0, -1))}
        onSelect={(value) => setValues([...values, value])}
        options={options}
        placeholder={'Přidat štítek'}
        query={query}
      >
        {values.map((value) => {
          const isArchived = archivedValues.includes(value)

          return (
            <Chip
              key={value}
              muted={isArchived}
              note={isArchived ? 'archivovaný' : undefined}
              onRemove={() =>
                setValues(values.filter((picked) => picked !== value))
              }
            >
              {TAGS.find((tag) => tag.value === value)?.label ?? value}
            </Chip>
          )
        })}
      </ChipInput>
    </div>
  )
}

const meta: Meta<typeof ChipInput> = {
  component: ChipInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Components/ChipInput',
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Interactive base case: the focus opens every suggestion, typing narrows
 * them, arrows and Enter pick, Backspace in the empty field removes the last
 * chip (design 24a).
 */
export const Playground: Story = {
  render: () => <ChipInputDemo initialValues={['podzim', 'cteni']} />,
}

/**
 * An archived tag the article already has: dashed, with *archivovaný*, never
 * offered again (iq3nur0e).
 */
export const WithArchived: Story = {
  render: () => (
    <ChipInputDemo
      archivedValues={['prazdniny']}
      initialValues={['podzim', 'cteni', 'prazdniny']}
    />
  ),
}

/**
 * The suggestions narrowed by typing, open.
 */
export const Searching: Story = {
  play: async ({ canvasElement }) => {
    within(canvasElement).getByRole('combobox').focus()
  },
  render: () => <ChipInputDemo initialQuery={'po'} initialValues={[]} />,
}
