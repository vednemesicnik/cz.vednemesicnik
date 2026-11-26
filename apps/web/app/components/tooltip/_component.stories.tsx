// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef } from 'react'

import { Button } from '~/components/button'
import { LinkIcon } from '~/components/icons/link-icon'
import { QuoteIcon } from '~/components/icons/quote-icon'
import { RedoIcon } from '~/components/icons/redo-icon'
import { UndoIcon } from '~/components/icons/undo-icon'

import { Tooltip } from './_component'

const meta: Meta<typeof Tooltip> = {
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Primitives/Tooltip',
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Interactive base case (controls enabled). Hover the button for half a
 * second, or Tab to it: the bubble shows at once on keyboard focus.
 */
export const Playground: Story = {
  args: {
    label: 'Citace',
    placement: 'top',
  },
  render: (args) => (
    <Tooltip {...args}>
      <Button aria-label={args.label} size={'sm'} variant={'ghost'}>
        <QuoteIcon />
      </Button>
    </Tooltip>
  ),
}

/**
 * A row of icon buttons: after the first label, moving to a neighbour shows
 * its label at once (within 300 ms).
 */
export const Neighbours: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[
        { icon: <LinkIcon />, label: 'Odkaz' },
        { icon: <QuoteIcon />, label: 'Citace' },
        { icon: <UndoIcon />, label: 'Zpět' },
        { icon: <RedoIcon />, label: 'Znovu' },
      ].map(({ icon, label }) => (
        <Tooltip key={label} label={label}>
          <Button aria-label={label} size={'sm'} variant={'ghost'}>
            {icon}
          </Button>
        </Tooltip>
      ))}
    </div>
  ),
}

/**
 * Below the trigger. Either placement flips when there is no room.
 */
export const Bottom: Story = {
  args: {
    label: 'Zpět',
    placement: 'bottom',
  },
  render: Playground.render,
}

const TruncatedName = ({ name }: { name: string }) => {
  const nameRef = useRef<HTMLAnchorElement>(null)

  return (
    <Tooltip label={name} truncatedRef={nameRef}>
      <a
        href={'#filter'}
        ref={nameRef}
        style={{
          display: 'block',
          inlineSize: '160px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {name}
      </a>
    </Tooltip>
  )
}

/**
 * A name cut off by its width, like a saved filter (22d): only the long one
 * shows a tooltip; the short one fits and is its own label.
 */
export const Truncated: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gap: '8px' }}>
      <TruncatedName name={'Rozpracované'} />
      <TruncatedName name={'Rozpracované články redakce na příští číslo'} />
    </div>
  ),
}
