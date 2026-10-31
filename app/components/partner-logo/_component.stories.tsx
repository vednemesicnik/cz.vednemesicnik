// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { PartnerLogoGroup } from '~/components/partner-logo-group'

import { PartnerLogo } from './_component'

const CITY_LOGO = {
  alt: 'Statutární město České Budějovice',
  height: 100,
  src: '/images/partners/statutarni-mesto-ceske-budejovice.svg',
  width: 236,
}

// Placeholder logos in the shapes the plate has to take (gm5nuxml).
const WIDE_LOGO = {
  alt: 'Poskytovatel dotace',
  height: 100,
  src: `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="100"><rect x="4" y="14" width="72" height="72" rx="10" fill="#1d4ed8"/><text x="96" y="66" font-family="Arial" font-size="40" font-weight="600" fill="#4b5563">Poskytovatel dotace</text></svg>',
  )}`,
  width: 500,
}

const SQUARE_LOGO = {
  alt: 'Kraj',
  height: 120,
  src: `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><circle cx="60" cy="60" r="54" fill="none" stroke="#111" stroke-width="8"/><text x="60" y="80" text-anchor="middle" font-family="Arial" font-size="58" font-weight="700" fill="#111">K</text></svg>',
  )}`,
  width: 120,
}

const meta: Meta<typeof PartnerLogo> = {
  component: PartnerLogo,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Components/PartnerLogo',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: CITY_LOGO,
}

/** The shapes in a 280 px frame: a 5 : 1 logo limited by the width, a square mark, two logos wrapping. */
export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gap: '24px', width: '280px' }}>
      <PartnerLogoGroup>
        <PartnerLogo {...WIDE_LOGO} />
      </PartnerLogoGroup>
      <PartnerLogoGroup>
        <PartnerLogo {...SQUARE_LOGO} />
      </PartnerLogoGroup>
      <PartnerLogoGroup>
        <PartnerLogo {...CITY_LOGO} />
        <PartnerLogo {...SQUARE_LOGO} />
      </PartnerLogoGroup>
    </div>
  ),
}
