// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { type ReactNode, useState } from 'react'

import { Link } from '~/components/link'
import { foldForSearch } from '~/utils/fold-for-search'

import { SuggestInput } from './_component'

const AUTHORS = [
  { label: 'Marie Horáková', role: 'Koordinátor', value: 'marie' },
  { label: 'Tereza Malá', role: 'Tvůrce', value: 'tereza' },
  { label: 'Veronika Pokorná', role: 'Přispěvatel', value: 'veronika' },
  { label: 'Vedneměsíčník, z. s.', role: null, value: 'spolek' },
]

type DemoProps = {
  initialQuery?: string
  noMatch?: (query: string) => ReactNode
}

// The field over a list of authors, each picked one listed under it.
const SuggestInputDemo = ({ initialQuery = '', noMatch }: DemoProps) => {
  const [values, setValues] = useState<string[]>([])
  const [query, setQuery] = useState(initialQuery)
  const foldedQuery = foldForSearch(query.trim())
  const options = AUTHORS.filter(
    (author) =>
      !values.includes(author.value) &&
      foldForSearch(author.label).includes(foldedQuery),
  )

  return (
    <div style={{ display: 'grid', gap: '8px', width: '320px' }}>
      <p style={{ margin: 0 }}>
        Vybráno:{' '}
        {values
          .map((value) => AUTHORS.find((author) => author.value === value))
          .map((author) => author?.label)
          .join(', ') || '—'}
      </p>
      <SuggestInput
        id={'authors'}
        label={'Autoři'}
        noMatch={noMatch?.(query.trim())}
        onQueryChange={setQuery}
        onSelect={(value) => setValues([...values, value])}
        options={options}
        placeholder={'Hledat autora'}
        query={query}
      >
        {(option) => (
          <span style={{ display: 'flex', gap: '10px' }}>
            <span style={{ flex: 1 }}>{option.label}</span>
            {option.role !== null && (
              <span style={{ color: 'var(--text-secondary)' }}>
                {option.role}
              </span>
            )}
          </span>
        )}
      </SuggestInput>
    </div>
  )
}

const meta: Meta<typeof SuggestInputDemo> = {
  component: SuggestInputDemo,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Components/SuggestInput',
}

export default meta
type Story = StoryObj<typeof meta>

// Type a letter: the list opens with the matching authors.
export const Playground: Story = {
  args: {},
}

// Nothing matches: one line (24j).
export const NoMatch: Story = {
  args: {
    initialQuery: 'Ondřej',
    noMatch: () =>
      'Žádný autor neodpovídá hledání. Nového autora může založit Administrátor nebo Vlastník.',
  },
}

// Nothing matches, for whoever may create an author: a link with the name.
export const NoMatchWithLink: Story = {
  args: {
    initialQuery: 'Ondřej',
    noMatch: (query) => <Link to={'#'}>Založit autora „{query}“</Link>,
  },
}
