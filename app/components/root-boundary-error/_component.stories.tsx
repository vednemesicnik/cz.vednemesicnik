// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

import { createRouteErrorResponse } from '~/components/boundary-error/utils/create-route-error-response'

import { RootBoundaryError } from './_component'

const meta: Meta<typeof RootBoundaryError> = {
  component: RootBoundaryError,
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/articles']}>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  title: 'Components/RootBoundaryError',
}

export default meta
type Story = StoryObj<typeof meta>

/** A layout failed (design 30g); development shows the diagnostics under the sentence. */
export const Playground: Story = {
  args: { error: new Error('boom') },
}

/** Any status renders the same copy — no 404 headline at the root. */
export const RouteErrorResponse: Story = {
  args: { error: createRouteErrorResponse(404) },
}
