// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { DisclosureContent } from '~/components/disclosure-content'
import { DisclosureSummary } from '~/components/disclosure-summary'

import { Disclosure } from './_component'

const meta: Meta<typeof Disclosure> = {
  component: Disclosure,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Components/Disclosure',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    children: (
      <>
        <DisclosureSummary>
          Posíláte dar ze zahraničního účtu?
        </DisclosureSummary>
        <DisclosureContent>
          <p style={{ margin: 0, maxInlineSize: '36rem' }}>
            Pošlete dar v eurech na IBAN níže se zprávou pro příjemce „Dar“, bez
            variabilního symbolu.
          </p>
        </DisclosureContent>
      </>
    ),
  },
}
