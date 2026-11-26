// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { ParentLink } from '~/components/parent-link'
import type { StatusTagState } from '~/components/status-tag'
import { TaxonomyPageKind } from '~/components/taxonomy-page-kind'

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

/** The head as a route composes it: the parent link, the name and the kind line. */
const head = ({
  kind = 'Rubrika',
  name,
  parent = { label: 'Rubriky', path: '/articles/categories' },
  previewState = null,
}: {
  kind?: string
  name: string
  parent?: { label: string; path: string }
  previewState?: StatusTagState | null
}) => (
  <>
    <ParentLink to={parent.path}>{parent.label}</ParentLink>
    <HeadlineGroup>
      <Headline>{name}</Headline>
      <TaxonomyPageKind previewState={previewState}>{kind}</TaxonomyPageKind>
    </HeadlineGroup>
  </>
)

export const Playground: Story = {
  args: {
    articles: Array.from({ length: 9 }, (_, index) => article(index + 1)),
    children: head({ name: 'Kultura' }),
    currentPage: 1,
    pageSize: 9,
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
    children: head({
      kind: 'Štítek',
      name: 'maturita',
      parent: { label: 'Štítky', path: '/articles/tags' },
    }),
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
    children: head({ name: 'Glosy', previewState: 'draft' }),
    totalCount: 2,
    totalPages: 1,
  },
}

/** No article the visitor can see: no count, no pagination (11b). */
export const Empty: Story = {
  args: {
    ...Playground.args,
    articles: [],
    children: head({ name: 'Sport' }),
    totalCount: 0,
    totalPages: 0,
  },
}
