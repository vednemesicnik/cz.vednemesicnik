// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

type TokenGroup = {
  title: string
  description?: string
  tokens: string[]
}

/**
 * Public theme semantic tokens, as defined on :root in
 * app/styles/semantic-tokens.css. Swatches are rendered live via var(--token),
 * so they never drift from the stylesheet.
 */
const TOKEN_GROUPS: TokenGroup[] = [
  {
    description: 'Základní povrchy stránek a sekcí.',
    title: 'Pozadí',
    tokens: [
      'bg-primary',
      'bg-secondary',
      'bg-tertiary',
      'bg-accent',
      'bg-hover',
      'bg-disabled',
    ],
  },
  {
    description: 'Ohraničení prvků v různých stavech.',
    title: 'Ohraničení',
    tokens: ['border', 'border-hover', 'border-strong', 'border-accent'],
  },
  {
    description: 'Barvy textu pro různé úrovně důležitosti.',
    title: 'Text',
    tokens: [
      'text-primary',
      'text-secondary',
      'text-tertiary',
      'text-on-accent',
    ],
  },
  {
    description: 'Primární akcent pro tlačítka, odkazy a zvýraznění (violet).',
    title: 'Primární',
    tokens: ['primary', 'primary-hover', 'primary-active', 'primary-light'],
  },
  {
    description: 'Sekundární akcent (amber).',
    title: 'Sekundární',
    tokens: ['secondary', 'secondary-hover', 'secondary-active'],
  },
  {
    description: 'Stavové barvy pro zpětnou vazbu uživateli.',
    title: 'Stavové',
    tokens: ['success', 'error', 'warning', 'info'],
  },
  {
    description: 'Povrchy chybových hlášení (např. přihlašovací formulář).',
    title: 'Chybové povrchy',
    tokens: ['error-bg', 'error-text'],
  },
]

/**
 * A single token rendered as a split swatch: the left half resolves the
 * token in light color-scheme, the right half in dark. Because light-dark()
 * resolves per element, both values are shown live from the same var().
 */
function Swatch({ token }: { token: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: '150px',
      }}
    >
      <div
        style={{
          border: '1px solid rgba(128, 128, 128, 0.25)',
          borderRadius: '8px',
          display: 'flex',
          height: '64px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: `var(--${token})`,
            colorScheme: 'light',
            flex: 1,
          }}
          title="light"
        />
        <div
          style={{
            background: `var(--${token})`,
            colorScheme: 'dark',
            flex: 1,
          }}
          title="dark"
        />
      </div>
      <code
        style={{
          color: 'var(--text-secondary)',
          fontSize: '11px',
          wordBreak: 'break-all',
        }}
      >
        --{token}
      </code>
    </div>
  )
}

function TokenGroupBlock({ group }: { group: TokenGroup }) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <div
        style={{
          borderBottom: '1px solid var(--border)',
          marginBottom: '20px',
          paddingBottom: '10px',
        }}
      >
        <h2
          style={{
            color: 'var(--text-primary)',
            fontSize: '15px',
            fontWeight: 700,
            margin: '0 0 4px',
          }}
        >
          {group.title}
        </h2>
        {group.description && (
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '12px',
              margin: 0,
            }}
          >
            {group.description}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
        {group.tokens.map((token) => (
          <Swatch key={token} token={token} />
        ))}
      </div>
    </div>
  )
}

function ColorPalette() {
  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        fontFamily: 'var(--font-family, Inter), sans-serif',
        minHeight: '100%',
        padding: '32px',
      }}
    >
      <div
        style={{
          borderBottom: '2px solid var(--text-primary)',
          marginBottom: '32px',
          paddingBottom: '16px',
        }}
      >
        <h1
          style={{
            color: 'var(--text-primary)',
            fontSize: '20px',
            fontWeight: 700,
            marginBottom: '6px',
          }}
        >
          Barevná paleta — veřejný web
        </h1>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '13px',
            margin: 0,
          }}
        >
          Sémantické tokeny z <code>semantic-tokens.css</code> (téma{' '}
          <code>:root</code>). Každý vzorek je vykreslen živě přes{' '}
          <code>var(--token)</code>; levá polovina = světlý režim, pravá = tmavý
          (<code>light-dark()</code>).
        </p>
      </div>

      {TOKEN_GROUPS.map((group) => (
        <TokenGroupBlock group={group} key={group.title} />
      ))}

      <div style={{ marginBottom: '40px' }}>
        <h2
          style={{
            color: 'var(--text-primary)',
            fontSize: '15px',
            fontWeight: 700,
            margin: '0 0 16px',
          }}
        >
          Gradient
        </h2>
        <div
          style={{
            background: 'var(--gradient-signature)',
            borderRadius: '8px',
            height: '80px',
            width: '100%',
          }}
        />
        <code
          style={{
            color: 'var(--text-secondary)',
            display: 'block',
            fontSize: '11px',
            marginTop: '8px',
          }}
        >
          --gradient-signature
        </code>
      </div>
    </div>
  )
}

const meta: Meta<typeof ColorPalette> = {
  component: ColorPalette,
  parameters: {
    docs: {
      description: {
        component:
          'Přehled sémantických barevných tokenů veřejného webu. Vzorky se čtou živě z CSS proměnných, takže vždy odpovídají stylesheetu.',
      },
    },
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  title: 'Design System/Colors',
}

export default meta
type Story = StoryObj<typeof meta>

export const Palette: Story = {}
