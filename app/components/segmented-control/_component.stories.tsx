// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { SegmentedControlHint } from '~/components/segmented-control-hint'
import { SegmentedControlLegend } from '~/components/segmented-control-legend'
import { SegmentedControlOption } from '~/components/segmented-control-option'
import { SegmentedControlOptions } from '~/components/segmented-control-options'

import { SegmentedControl } from './_component'

const colorSchemeOptions = [
  { label: 'Systém', value: 'system' },
  { label: 'Světlý', value: 'light' },
  { label: 'Tmavý', value: 'dark' },
]

// The control is controlled; the story keeps the choice so a click moves it.
// As in Nastavení (29a), the hint shows only under Systém.
const StatefulSegmentedControl = ({
  initialValue,
}: {
  initialValue: string
}) => {
  const [value, setValue] = useState(initialValue)

  return (
    <SegmentedControl
      name={'colorScheme'}
      onChange={(event) => setValue(event.currentTarget.value)}
      value={value}
    >
      <SegmentedControlLegend>Režim</SegmentedControlLegend>
      <SegmentedControlOptions>
        {colorSchemeOptions.map((option) => (
          <SegmentedControlOption key={option.value} value={option.value}>
            {option.label}
          </SegmentedControlOption>
        ))}
      </SegmentedControlOptions>
      {value === 'system' && (
        <SegmentedControlHint>
          Vzhled se řídí nastavením zařízení.
        </SegmentedControlHint>
      )}
    </SegmentedControl>
  )
}

const meta: Meta<typeof SegmentedControl> = {
  argTypes: {
    children: { control: false },
    name: { control: false },
    onChange: { control: false },
    value: {
      control: 'inline-radio',
      options: colorSchemeOptions.map((option) => option.value),
    },
  },
  component: SegmentedControl,
  parameters: {
    layout: 'centered',
  },
  // The control sets the starting choice; a click moves it from there.
  render: (args) => (
    <StatefulSegmentedControl initialValue={args.value} key={args.value} />
  ),
  tags: ['autodocs'],
  title: 'Components/SegmentedControl',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    value: 'system',
  },
}

export const WithoutHint: Story = {
  args: {
    value: 'dark',
  },
  parameters: { controls: { disable: true } },
}
