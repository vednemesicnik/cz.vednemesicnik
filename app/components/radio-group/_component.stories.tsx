// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { Callout } from '~/components/callout'
import { Radio } from '~/components/radio'

import { RadioGroup } from './_component'

const meta: Meta<typeof RadioGroup> = {
  argTypes: {
    disabled: { control: 'boolean' },
  },
  component: RadioGroup,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Primitives/RadioGroup',
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Interactive base case (controls enabled): Autorská role on Nový autor, each
 * role with what it allows (design 28c).
 */
export const Playground: Story = {
  args: {
    children: (
      <>
        <Radio
          defaultChecked={true}
          hint={'Píše vlastní koncepty a odesílá je ke schválení.'}
          name={'role'}
          value={'contributor'}
        >
          Přispěvatel
        </Radio>
        <Radio
          hint={
            'Píše vlastní koncepty, odesílá je ke schválení a vidí i cizí koncepty.'
          }
          name={'role'}
          value={'creator'}
        >
          Tvůrce
        </Radio>
        <Radio
          hint={'Schvaluje a publikuje obsah celé redakce.'}
          name={'role'}
          value={'coordinator'}
        >
          Koordinátor
        </Radio>
      </>
    ),
    legend: 'Autorská role',
  },
}

/**
 * Without hints, with a warning about the chosen role under the radios, as
 * on Upravit autora.
 */
export const WithNote: Story = {
  args: {
    children: (
      <>
        <Radio name={'role-note'} value={'contributor'}>
          Přispěvatel
        </Radio>
        <Radio name={'role-note'} value={'creator'}>
          Tvůrce
        </Radio>
        <Radio defaultChecked={true} name={'role-note'} value={'coordinator'}>
          Koordinátor
        </Radio>
        <Callout className={'story-callout'} tone={'warning'}>
          Role Koordinátor umožňuje schvalovat a publikovat veškerý obsah.
        </Callout>
      </>
    ),
    legend: 'Autorská role',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '460px' }}>
        <style>{'.story-callout { margin-block: 0; }'}</style>
        <Story />
      </div>
    ),
  ],
}

export const Disabled: Story = {
  args: { ...Playground.args, disabled: true },
}
