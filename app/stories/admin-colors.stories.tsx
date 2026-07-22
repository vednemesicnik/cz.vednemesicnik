// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

type TokenGroup = {
  title: string
  description?: string
  tokens: string[]
}

/**
 * Administration theme tokens. The neutral/accent groups are the shades
 * overridden under [data-theme='admin']; the state/action/danger groups are
 * admin-only tokens defined on :root. All are rendered live via var(--token)
 * inside a data-theme="admin" wrapper, so they never drift from the stylesheet.
 */
const TOKEN_GROUPS: TokenGroup[] = [
  {
    description: 'Základní povrchy administrace (midnight).',
    title: 'Pozadí',
    tokens: [
      'bg-primary',
      'bg-secondary',
      'bg-tertiary',
      'bg-hover',
      'bg-disabled',
    ],
  },
  {
    description: 'Ohraničení prvků v různých stavech.',
    title: 'Ohraničení',
    tokens: ['border', 'border-hover', 'border-strong'],
  },
  {
    description: 'Barvy textu pro různé úrovně důležitosti.',
    title: 'Text',
    tokens: ['text-primary', 'text-secondary', 'text-tertiary'],
  },
  {
    description: 'Primární akcent administrace (sytější violet).',
    title: 'Primární',
    tokens: ['primary', 'primary-hover', 'primary-active'],
  },
  {
    description: 'Stavové barvy pro zpětnou vazbu a chybové povrchy.',
    title: 'Stavové',
    tokens: ['success', 'error', 'warning', 'error-bg', 'error-text'],
  },
  {
    description: 'Odznaky stavů obsahu (koncept / publikováno / archivováno).',
    title: 'Stavy obsahu',
    tokens: [
      'state-draft-bg',
      'state-draft-text',
      'state-published-bg',
      'state-published-text',
      'state-archived-bg',
      'state-archived-text',
    ],
  },
  {
    description: 'Barvy akcí v životním cyklu obsahu.',
    title: 'Akce',
    tokens: [
      'action-publish',
      'action-retract',
      'action-archive',
      'action-restore',
      'action-review',
    ],
  },
  {
    description: 'Destruktivní akce (mazání).',
    title: 'Danger',
    tokens: ['danger', 'danger-hover', 'danger-active', 'danger-text'],
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

function AdminColorPalette() {
  return (
    <div
      data-theme="admin"
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
          Barevná paleta — administrace
        </h1>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '13px',
            margin: 0,
          }}
        >
          Sémantické tokeny z <code>semantic-tokens.css</code> (téma{' '}
          <code>[data-theme=&apos;admin&apos;]</code>). Každý vzorek je
          vykreslen živě přes <code>var(--token)</code>; levá polovina = světlý
          režim, pravá = tmavý (<code>light-dark()</code>).
        </p>
      </div>

      {TOKEN_GROUPS.map((group) => (
        <TokenGroupBlock group={group} key={group.title} />
      ))}
    </div>
  )
}

const meta: Meta<typeof AdminColorPalette> = {
  component: AdminColorPalette,
  parameters: {
    docs: {
      description: {
        component:
          'Přehled sémantických barevných tokenů administrace. Vzorky se čtou živě z CSS proměnných uvnitř data-theme="admin", takže vždy odpovídají stylesheetu.',
      },
    },
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  title: 'Design System/Admin Colors',
}

export default meta
type Story = StoryObj<typeof meta>

export const Palette: Story = {}
