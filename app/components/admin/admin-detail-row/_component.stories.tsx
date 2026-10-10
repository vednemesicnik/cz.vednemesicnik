// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '~/components/button'

import { AdminDetailSection } from '../admin-detail-section'
import { AdminDetailRow } from './_component'

const meta: Meta<typeof AdminDetailRow> = {
  argTypes: {
    actions: { control: false },
    align: {
      control: 'inline-radio',
      options: ['center', 'start'],
    },
    children: { control: false },
  },
  component: AdminDetailRow,
  // The 480 px rule measures the section around the row; `width` narrows it.
  decorators: [
    (Story, { parameters }) => (
      <div style={{ width: parameters.width }}>
        <AdminDetailSection>
          <Story />
        </AdminDetailSection>
      </div>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Administration/AdminDetailRow',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    actions: (
      <Button size="sm" type="button" variant="outline">
        Změnit…
      </Button>
    ),
    align: 'center',
    children: 'nastavené',
    label: 'Heslo',
  },
}

export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div>
      <AdminDetailRow label="Odkaz v e-mailu">
        <span>k dispozici</span>
        <span>Na redakce@vednemesicnik.cz. Nic se nenastavuje.</span>
      </AdminDetailRow>
      <AdminDetailRow
        actions={
          <Button size="sm" type="button" variant="outline">
            Přidat passkey
          </Button>
        }
        align="start"
        label="Passkey"
      >
        <span>Synchronizovaný · přidán 2. 10. 2026</span>
        <span>Vázaný na zařízení · přidán 5. 10. 2026</span>
      </AdminDetailRow>
    </div>
  ),
}

// Under 480 px the name stands above the value, as in the right column.
export const Narrow: Story = {
  args: Playground.args,
  parameters: { width: '300px' },
}
