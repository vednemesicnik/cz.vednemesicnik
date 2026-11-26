// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

import { ButtonLink } from '~/components/button-link'
import { Link } from '~/components/link'
import { PreviewBarMarker } from '~/components/preview-bar-marker'
import { PreviewBarMessage } from '~/components/preview-bar-message'
import { PreviewBarNarrow } from '~/components/preview-bar-narrow'
import { PreviewBarTitle } from '~/components/preview-bar-title'
import { PreviewBarWide } from '~/components/preview-bar-wide'
import { PreviewBar } from './_component'

const meta: Meta<typeof PreviewBar> = {
  component: PreviewBar,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  title: 'Components/PreviewBar',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    children: (
      <>
        <PreviewBarMessage>
          <PreviewBarMarker />
          <PreviewBarTitle>
            Náhled redakce<PreviewBarWide>.</PreviewBarWide>
          </PreviewBarTitle>
          <PreviewBarWide>
            {' '}
            Obsah s čárkovaným rámečkem čtenáři nevidí.
          </PreviewBarWide>
        </PreviewBarMessage>
        <ButtonLink>
          <PreviewBarWide>Zobrazit jako čtenář</PreviewBarWide>
          <PreviewBarNarrow>Jako čtenář</PreviewBarNarrow>
        </ButtonLink>
      </>
    ),
  },
}

export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gap: '16px' }}>
      <PreviewBar>
        <PreviewBarMessage>
          <PreviewBarMarker />
          <PreviewBarTitle>
            Náhled redakce<PreviewBarWide>.</PreviewBarWide>
          </PreviewBarTitle>
          <PreviewBarWide>
            {' '}
            Obsah s čárkovaným rámečkem čtenáři nevidí.
          </PreviewBarWide>
        </PreviewBarMessage>
        <ButtonLink>
          <PreviewBarWide>Zobrazit jako čtenář</PreviewBarWide>
          <PreviewBarNarrow>Jako čtenář</PreviewBarNarrow>
        </ButtonLink>
      </PreviewBar>
      <PreviewBar>
        <PreviewBarMessage>
          <PreviewBarTitle>
            Náhled redakce<PreviewBarWide>.</PreviewBarWide>
          </PreviewBarTitle>
          <PreviewBarWide> Tento článek čtenáři nevidí.</PreviewBarWide>
        </PreviewBarMessage>
        <Link to={'/administration/articles/clanek'}>
          Zobrazit v administraci
        </Link>
      </PreviewBar>
      <PreviewBar>
        <PreviewBarMessage>
          <PreviewBarTitle>Pohled čtenáře</PreviewBarTitle>
        </PreviewBarMessage>
        <ButtonLink>Zapnout náhled redakce</ButtonLink>
      </PreviewBar>
    </div>
  ),
}
