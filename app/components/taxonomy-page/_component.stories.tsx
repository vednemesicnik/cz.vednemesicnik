// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

import { TaxonomyPage } from './_component'

const meta: Meta<typeof TaxonomyPage> = {
  component: TaxonomyPage,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Components/TaxonomyPage',
}

export default meta
type Story = StoryObj<typeof meta>

const article = (index: number) => ({
  authors: [{ name: 'Anna Dvořáková' }],
  categories: [{ name: 'Rozhovor', previewState: null, slug: 'rozhovor' }],
  featuredImage: null,
  id: `article-${index}`,
  previewState: null,
  publishedAt: {
    formatted: `${index}. září 2026`,
    iso: `2026-09-${String(index).padStart(2, '0')}T08:00:00.000Z`,
  },
  slug: `clanek-${index}`,
  title: `Jak vzniká školní divadlo, díl ${index}`,
})

export const Playground: Story = {
  args: {
    articles: Array.from({ length: 9 }, (_, index) => article(index + 1)),
    currentPage: 1,
    kindLabel: 'Rubrika',
    name: 'Kultura',
    pageSize: 9,
    parent: { label: 'Rubriky', path: '/articles/categories' },
    previewState: null,
    totalCount: 18,
    totalPages: 2,
  },
}

export const WithPreview: Story = {
  args: {
    ...Playground.args,
    articles: [
      { ...article(1), previewState: 'draft' as const },
      { ...article(2), previewState: 'pending' as const },
      article(3),
      { ...article(4), previewState: 'archived' as const },
    ],
    totalCount: 4,
    totalPages: 1,
  },
}

export const Tag: Story = {
  args: {
    ...Playground.args,
    articles: [article(1)],
    kindLabel: 'Štítek',
    name: 'maturita',
    parent: { label: 'Štítky', path: '/articles/tags' },
    totalCount: 1,
    totalPages: 1,
  },
}

/**
 * A category the reader doesn't see, in the editorial preview: the grey tag
 * after the kind line, its draft article outlined, and a draft badge (11e).
 */
export const UnpublishedCategory: Story = {
  args: {
    ...Playground.args,
    articles: [
      { ...article(1), previewState: 'draft' as const },
      {
        ...article(2),
        categories: [
          { name: 'Rozhovor', previewState: null, slug: 'rozhovor' },
          { name: 'Recenze', previewState: 'draft' as const, slug: 'recenze' },
        ],
      },
    ],
    name: 'Glosy',
    previewState: 'draft',
    totalCount: 2,
    totalPages: 1,
  },
}

/** No article the visitor can see: no count, no pagination (11b). */
export const Empty: Story = {
  args: {
    ...Playground.args,
    articles: [],
    name: 'Sport',
    totalCount: 0,
    totalPages: 0,
  },
}
