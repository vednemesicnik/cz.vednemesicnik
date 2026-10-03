// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

import { BoundaryError } from './_component'
import { createRouteErrorResponse } from './utils/create-route-error-response'

const notFound = createRouteErrorResponse(404)

const meta: Meta<typeof BoundaryError> = {
  argTypes: {
    kind: {
      control: 'select',
      description: 'Overrides the content kind derived from the address',
      options: [
        undefined,
        null,
        'article',
        'category',
        'tag',
        'podcast',
        'episode',
        'issue',
      ],
    },
  },
  component: BoundaryError,
  decorators: [
    (Story, context) => (
      <MemoryRouter initialEntries={[context.parameters.pathname ?? '/nope']}>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Components/BoundaryError',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: { error: notFound, kind: 'article' },
}

/** 404 on `/articles/…` (design 30f). */
export const NotFoundArticle: Story = {
  args: { error: notFound },
  parameters: { pathname: '/articles/kdo-pise-maturitni-otazky' },
}

/** 404 on `/articles/categories/…`. */
export const NotFoundCategory: Story = {
  args: { error: notFound },
  parameters: { pathname: '/articles/categories/skola' },
}

/** 404 on `/articles/tags/…`. */
export const NotFoundTag: Story = {
  args: { error: notFound },
  parameters: { pathname: '/articles/tags/rozhovor' },
}

/** 404 on `/podcasts/…`. */
export const NotFoundPodcast: Story = {
  args: { error: notFound },
  parameters: { pathname: '/podcasts/nejaky-podcast' },
}

/** 404 of an episode whose podcast is public — offers `Na podcast`. */
export const NotFoundEpisodeOfPublicPodcast: Story = {
  args: {
    error: createRouteErrorResponse(404, {
      podcastHref: '/podcasts/nejaky-podcast',
    }),
  },
  parameters: { pathname: '/podcasts/nejaky-podcast/nejaka-epizoda' },
}

/** 404 of an episode whose podcast isn't public. */
export const NotFoundEpisode: Story = {
  args: { error: notFound },
  parameters: { pathname: '/podcasts/nejaky-podcast/nejaka-epizoda' },
}

/** 404 on `/archive/…`. */
export const NotFoundIssue: Story = {
  args: { error: notFound },
  parameters: { pathname: '/archive/2024-01.pdf' },
}

/** 404 on any other address. */
export const NotFoundPage: Story = {
  args: { error: notFound },
  parameters: { pathname: '/nope' },
}

/** Unexpected error (design 30g); development shows the diagnostics under the sentence. */
export const Unexpected: Story = {
  args: { error: new Error('boom') },
  parameters: { pathname: '/articles' },
}
