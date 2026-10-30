// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

import { PreviewBarButton } from '~/components/preview-bar-button'
import { PreviewBarLink } from '~/components/preview-bar-link'
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
        <PreviewBarButton>
          <PreviewBarWide>Zobrazit jako čtenář</PreviewBarWide>
          <PreviewBarNarrow>Jako čtenář</PreviewBarNarrow>
        </PreviewBarButton>
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
        <PreviewBarButton>
          <PreviewBarWide>Zobrazit jako čtenář</PreviewBarWide>
          <PreviewBarNarrow>Jako čtenář</PreviewBarNarrow>
        </PreviewBarButton>
      </PreviewBar>
      <PreviewBar>
        <PreviewBarMessage>
          <PreviewBarTitle>
            Náhled redakce<PreviewBarWide>.</PreviewBarWide>
          </PreviewBarTitle>
          <PreviewBarWide> Tento článek čtenáři nevidí.</PreviewBarWide>
        </PreviewBarMessage>
        <PreviewBarLink to={'/administration/articles/clanek'}>
          Zobrazit v administraci
        </PreviewBarLink>
      </PreviewBar>
      <PreviewBar>
        <PreviewBarMessage>
          <PreviewBarTitle>Pohled čtenáře</PreviewBarTitle>
        </PreviewBarMessage>
        <PreviewBarButton>Zapnout náhled redakce</PreviewBarButton>
      </PreviewBar>
    </div>
  ),
}
