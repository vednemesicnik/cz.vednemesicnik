// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { AdminDetailSection } from '../admin-detail-section'
import { AdminSignInAttempts } from './_component'

const meta: Meta<typeof AdminSignInAttempts> = {
  argTypes: {
    attempts: { control: 'object' },
  },
  component: AdminSignInAttempts,
  // The right column is 300 px (--detail-aside-width); `width` sets it.
  decorators: [
    (Story, { parameters }) => (
      <div style={{ width: parameters.width }}>
        <AdminDetailSection title="Poslední pokusy o přihlášení">
          <Story />
        </AdminDetailSection>
      </div>
    ),
  ],
  parameters: {
    layout: 'padded',
    width: '300px',
  },
  tags: ['autodocs'],
  title: 'Administration/AdminSignInAttempts',
}

export default meta
type Story = StoryObj<typeof meta>

// The rows of 29a: a 2FA sign-in after a failed code, a failed password.
export const Playground: Story = {
  args: {
    attempts: [
      {
        dateTime: '2026-09-25T17:14:00.000Z',
        formattedDateTime: '25. 9. 2026, 19:14',
        id: '1',
        isFailure: false,
        label: 'Passkey',
      },
      {
        dateTime: '2026-09-24T06:03:00.000Z',
        formattedDateTime: '24. 9. 2026, 8:03',
        id: '2',
        isFailure: false,
        label: 'Kód z ověřovací aplikace',
      },
      {
        dateTime: '2026-09-24T06:02:00.000Z',
        formattedDateTime: '24. 9. 2026, 8:02',
        id: '3',
        isFailure: true,
        label: 'Kód z ověřovací aplikace\u00a0— neúspěšný pokus',
      },
      {
        dateTime: '2026-09-22T05:52:00.000Z',
        formattedDateTime: '22. 9. 2026, 7:52',
        id: '4',
        isFailure: false,
        label: 'Odkaz v e-mailu',
      },
      {
        dateTime: '2026-09-22T05:50:00.000Z',
        formattedDateTime: '22. 9. 2026, 7:50',
        id: '5',
        isFailure: true,
        label: 'Heslo\u00a0— neúspěšný pokus',
      },
    ],
  },
}

// The main column's width, as on the user detail (28e) under 820 px.
export const Wide: Story = {
  args: Playground.args,
  parameters: { width: '640px' },
}
