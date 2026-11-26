// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'
import { StepperStep } from '~/components/stepper-step'

import { Stepper } from './_component'

const meta: Meta<typeof Stepper> = {
  component: Stepper,
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
  title: 'Components/Stepper',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    children: (
      <>
        <StepperStep state={'done'} to={'/'}>
          Údaje
        </StepperStep>
        <StepperStep state={'current'}>Podpis a odeslání</StepperStep>
      </>
    ),
    label: 'Kroky',
  },
}

export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gap: '32px', maxWidth: '360px' }}>
      <Stepper label={'První krok'}>
        <StepperStep state={'current'}>Údaje</StepperStep>
        <StepperStep state={'upcoming'}>Podpis a odeslání</StepperStep>
      </Stepper>
      <Stepper label={'Druhý krok'}>
        <StepperStep state={'done'} to={'/'}>
          Údaje
        </StepperStep>
        <StepperStep state={'current'}>Podpis a odeslání</StepperStep>
      </Stepper>
      <Stepper label={'Tři kroky'}>
        <StepperStep state={'done'} to={'/'}>
          Údaje
        </StepperStep>
        <StepperStep state={'current'}>Podpis</StepperStep>
        <StepperStep state={'upcoming'}>Odeslání</StepperStep>
      </Stepper>
    </div>
  ),
}
