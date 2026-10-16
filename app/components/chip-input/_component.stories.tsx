// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { within } from 'storybook/test'

import { Chip } from '~/components/chip'
import { foldForSearch } from '~/utils/fold-for-search'
import { createImageSources } from '~/utils/image-store/create-image-sources'

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
  /** Tags out of play, by value: the word their chip and suggestion carry. */
  stateNotes?: Record<string, string>
}

// The field with its chips and a search over the tags, as the editor uses it.
const ChipInputDemo = ({
  initialValues,
  initialQuery = '',
  stateNotes = {},
}: DemoProps) => {
  const [values, setValues] = useState(initialValues)
  const [query, setQuery] = useState(initialQuery)
  const foldedQuery = foldForSearch(query.trim())
  // One out of play is offered under the others, with its word (8kfn4ou3).
  const options = TAGS.filter(
    (tag) =>
      !values.includes(tag.value) &&
      foldForSearch(tag.label).includes(foldedQuery),
  )
    .map((tag) => ({ ...tag, note: stateNotes[tag.value] }))
    .sort(
      (first, second) =>
        Number(first.note !== undefined) - Number(second.note !== undefined),
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
          const note = stateNotes[value]

          return (
            <Chip
              key={value}
              muted={note !== undefined}
              note={note}
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
 * Tags the article has out of play: dashed, with *archivovaný* or *v konceptu*
 * (iq3nur0e, 8kfn4ou3).
 */
export const WithArchived: Story = {
  render: () => (
    <ChipInputDemo
      initialValues={['podzim', 'cteni', 'prazdniny', 'sport']}
      stateNotes={{ prazdniny: 'archivovaný', sport: 'v konceptu' }}
    />
  ),
}

/**
 * An archived tag removed by mistake: offered under the others, with its word,
 * until the editor closes (8kfn4ou3).
 */
export const ArchivedOffered: Story = {
  play: async ({ canvasElement }) => {
    within(canvasElement).getByRole('combobox').focus()
  },
  render: () => (
    <ChipInputDemo
      initialValues={['podzim', 'cteni']}
      stateNotes={{ prazdniny: 'archivovaný' }}
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

const NO_IMAGE = createImageSources('user-image', undefined)

const AUTHORS = [
  { label: 'Tereza Malá', note: 'Tvůrce', value: 'tereza' },
  { label: 'Veronika Pokorná', note: 'Přispěvatel', value: 'veronika' },
  { label: 'Vedneměsíčník, z. s.', value: 'spolek' },
].map((author) => ({ ...author, avatar: NO_IMAGE }))

type AuthorSearchDemoProps = {
  initialQuery: string
  canCreate?: boolean
}

// Without chips: the field searches, the picked authors are rows above it.
const AuthorSearchDemo = ({
  initialQuery,
  canCreate = false,
}: AuthorSearchDemoProps) => {
  const [query, setQuery] = useState(initialQuery)
  const foldedQuery = foldForSearch(query.trim())

  return (
    <div style={{ width: '300px' }}>
      <ChipInput
        createLabel={`Založit autora „${query.trim()}“`}
        emptyLabel={
          'Žádný autor neodpovídá hledání. Nového autora může založit Administrátor nebo Vlastník.'
        }
        id={'authors'}
        isLabelHidden
        label={'Hledat autora'}
        onCreate={canCreate ? () => {} : undefined}
        onQueryChange={setQuery}
        onSelect={() => setQuery('')}
        options={AUTHORS.filter((author) =>
          foldForSearch(author.label).includes(foldedQuery),
        )}
        placeholder={'Hledat autora'}
        query={query}
      />
    </div>
  )
}

/**
 * The author search (24j, ivyin4kr): no chips, each suggestion with an
 * avatar, the name and the role; the association has none.
 */
export const Authors: Story = {
  play: async ({ canvasElement }) => {
    within(canvasElement).getByRole('combobox').focus()
  },
  render: () => <AuthorSearchDemo initialQuery={''} />,
}

/** No match: one line, not an option (24j). */
export const AuthorsNoMatch: Story = {
  play: async ({ canvasElement }) => {
    within(canvasElement).getByRole('combobox').focus()
  },
  render: () => <AuthorSearchDemo initialQuery={'Hana Dvořáková'} />,
}

/** Who may create an author gets the last option instead (24j). */
export const AuthorsCreate: Story = {
  play: async ({ canvasElement }) => {
    within(canvasElement).getByRole('combobox').focus()
  },
  render: () => <AuthorSearchDemo canCreate initialQuery={'Ve'} />,
}
