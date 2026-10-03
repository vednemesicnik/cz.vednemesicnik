// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

import { createRouteErrorResponse } from '~/components/boundary-error/utils/create-route-error-response'

import { AdminBoundaryError } from './_component'

const notFound = createRouteErrorResponse(404)

const meta: Meta<typeof AdminBoundaryError> = {
  argTypes: {
    kind: {
      control: 'select',
      description: 'Overrides the record kind derived from the address',
      options: [
        undefined,
        null,
        'article',
        'category',
        'tag',
        'podcast',
        'episode',
        'issue',
        'author',
        'user',
      ],
    },
  },
  component: AdminBoundaryError,
  decorators: [
    (Story, context) => (
      <MemoryRouter
        initialEntries={[context.parameters.pathname ?? '/administration']}
      >
        <Story />
      </MemoryRouter>
    ),
  ],
  globals: { theme: 'admin' },
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Administration/AdminBoundaryError',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: { error: notFound, kind: 'article' },
}

/** 404 of a record, the type taken from the section in the address (design 30e). */
export const NotFoundArticle: Story = {
  args: { error: notFound },
  parameters: { pathname: '/administration/articles/a1' },
}

/** Every record type side by side. */
export const NotFoundRecords: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gap: '24px' }}>
      {(
        [
          'article',
          'issue',
          'podcast',
          'episode',
          'category',
          'tag',
          'author',
          'user',
        ] as const
      ).map((kind) => (
        <AdminBoundaryError error={notFound} key={kind} kind={kind} />
      ))}
    </div>
  ),
}

/** 404 of an episode leads back to its podcast. */
export const NotFoundEpisode: Story = {
  args: { error: notFound },
  parameters: { pathname: '/administration/podcasts/p1/episodes/e1' },
}

/** 404 of an address that doesn't exist. */
export const NotFoundAddress: Story = {
  args: { error: notFound },
  parameters: { pathname: '/administration/nope' },
}

/** 403 with a reason the server composed (design 30d). */
export const ForbiddenWithReason: Story = {
  args: {
    error: createRouteErrorResponse(403, {
      actions: [
        { href: '/administration/articles/a1', label: 'Zobrazit článek' },
        { href: '/administration/articles', label: 'Na články' },
      ],
      cause: 'permission',
      reason:
        'Upravovat lze až po stažení z publikace — článek je publikovaný.',
      title: 'Článek „Kdo píše maturitní otázky“ teď upravit nejde',
    }),
  },
  parameters: { pathname: '/administration/articles/a1/edit-article' },
}

/** 403 for a section the user has no access to (design 30d). */
export const ForbiddenSection: Story = {
  args: {
    error: createRouteErrorResponse(403, {
      actions: [{ href: '/administration', label: 'Na přehled' }],
      cause: 'permission',
      reason: 'Účty spravuje Administrátor nebo Vlastník.',
      title: 'Do sekce Uživatelé nemáte přístup',
    }),
  },
  parameters: { pathname: '/administration/users' },
}

/** 403 for an invalid form token on an action without its own form (design 30h). */
export const ForbiddenCsrf: Story = {
  args: {
    error: createRouteErrorResponse(403, {
      cause: 'csrf',
      href: '/administration/articles/a1',
    }),
  },
  parameters: { pathname: '/administration/articles/a1' },
}

/** 403 without a composed reason (design 30h). */
export const ForbiddenGeneric: Story = {
  args: { error: createRouteErrorResponse(403, 'Forbidden') },
  parameters: { pathname: '/administration/settings/profile' },
}

/** Unexpected error (design 30g); development shows the diagnostics under the sentence. */
export const Unexpected: Story = {
  args: { error: new Error('boom') },
  parameters: { pathname: '/administration/articles' },
}
