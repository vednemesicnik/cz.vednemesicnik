// noinspection JSUnusedGlobalSymbols

import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { type ComponentProps, useRef } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'

import { AdminButton } from '~/components/admin/admin-button'
import { AuthenticityTokenProvider } from '~/components/authenticity-token-provider'
import { FORM_CONFIG } from '~/config/form-config'

import { AdminPublishDateDialog } from './_component'

// The dialog opens imperatively via a ref and needs a trigger, so stories wrap
// it in a small harness that owns the ref and a button to open it. The harness
// props are exactly the dialog's props minus the ref — a clean controls panel.
type PreviewProps = Omit<ComponentProps<typeof AdminPublishDateDialog>, 'ref'>

const AdminPublishDateDialogPreview = (props: PreviewProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)

  return (
    <>
      <AdminButton
        onClick={() => dialogRef.current?.showModal()}
        type={'button'}
      >
        Otevřít dialog
      </AdminButton>
      <AdminPublishDateDialog ref={dialogRef} {...props} />
    </>
  )
}

// useFetcher requires a data router; the token provider satisfies the CSRF hook.
const withDataRouter: Decorator = (Story) => {
  const router = createMemoryRouter(
    [
      {
        action: () => null,
        // Catch-all so the fetcher's submit to any action href resolves here
        // instead of 404-ing; the action itself is a no-op for the preview.
        Component: () => (
          <AuthenticityTokenProvider token={'storybook-csrf-token'}>
            <Story />
          </AuthenticityTokenProvider>
        ),
        path: '*',
      },
    ],
    { initialEntries: ['/'] },
  )

  return <RouterProvider router={router} />
}

const meta: Meta<typeof AdminPublishDateDialogPreview> = {
  component: AdminPublishDateDialogPreview,
  decorators: [withDataRouter],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Administration/AdministrationPublishDateDialog',
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Backdated publish (draft article): publishes with a chosen past date so the
 * article lands at the matching spot in the public listing.
 */
export const BackdatedPublish: Story = {
  args: {
    action: '/administration/articles/example',
    confirmLabel: 'Zveřejnit',
    description:
      'Článek bude publikován se zvoleným datem v minulosti a zařadí se tak na odpovídající místo ve výpisu článků.',
    fetcherKey: 'backdated-publish',
    intent: FORM_CONFIG.intent.value.publish,
    title: 'Zveřejnit zpětně',
  },
}

/**
 * Change publish date (published article): a deliberate, correction-only action
 * that reorders the listing and changes the SEO published date.
 */
export const ChangePublishDate: Story = {
  args: {
    action: '/administration/articles/example',
    confirmLabel: 'Změnit datum',
    // ISO/UTC instant; the picker seeds it converted to the browser's local time.
    defaultPublishedAt: '2026-05-15T07:00:00.000Z',
    description:
      'Skutečně si přejete změnit datum vydání? Článek se přeřadí ve výpisu a změní se datum publikace v metadatech pro vyhledávače. Akce je určena k opravě chyb.',
    fetcherKey: 'change-published-at',
    intent: 'change-published-at',
    title: 'Změnit datum vydání',
  },
}
