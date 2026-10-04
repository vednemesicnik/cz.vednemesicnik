// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

type TokenGroup = {
  title: string
  description?: string
  tokens: string[]
}

/**
 * Semantic color roles from app/styles/semantic-tokens.css — one map for the
 * public web and the administration, grouped as in the design system's
 * tokens/semantic.css. Swatches are rendered live via var(--token), so they
 * never drift from the stylesheet.
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
    description:
      'Primární akcent pro tlačítka a zvýraznění (violet). V tmavém režimu zůstává violet-500, aby bílý text tlačítek držel kontrast.',
    title: 'Primární',
    tokens: ['primary', 'primary-hover', 'primary-active', 'primary-light'],
  },
  {
    description: 'Sekundární akcent (amber).',
    title: 'Sekundární',
    tokens: [
      'secondary',
      'secondary-hover',
      'secondary-active',
      'secondary-light',
    ],
  },
  {
    description: 'Stavové barvy pro zpětnou vazbu uživateli a jejich povrchy.',
    title: 'Stavové',
    tokens: [
      'success',
      'error',
      'warning',
      'info',
      'error-bg',
      'error-text',
      'bg-success',
      'text-success',
    ],
  },
  {
    description: 'Destruktivní akce (rose), bílý text v obou režimech.',
    title: 'Nebezpečné akce',
    tokens: ['danger', 'danger-hover', 'danger-active', 'danger-text'],
  },
  {
    description:
      'Odkazy. Silný odkaz je drobný akcentní text na tónovaném nebo šedém podkladu (aktivní záložka, aktivní položka postranního panelu).',
    title: 'Odkazy',
    tokens: ['link', 'link-hover', 'link-visited', 'link-strong'],
  },
  {
    description: 'Odznaky kategorií a štítků.',
    title: 'Odznaky',
    tokens: [
      'badge-emerald-bg',
      'badge-emerald-text',
      'badge-violet-bg',
      'badge-violet-text',
      'badge-amber-bg',
      'badge-amber-text',
      'badge-rose-bg',
      'badge-rose-text',
      'badge-azure-bg',
      'badge-azure-text',
      'badge-outline-border',
    ],
  },
  {
    description:
      'Stavy obsahu (StatusTag): šedá — nikdo nečeká, amber — čeká na tebe, zelená — hotovo, šedá — mimo hru.',
    title: 'Stavy obsahu',
    tokens: [
      'state-draft-bg',
      'state-draft-text',
      'state-draft-border',
      'state-pending-bg',
      'state-pending-text',
      'state-pending-border',
      'state-approved-bg',
      'state-approved-text',
      'state-approved-border',
      'state-published-bg',
      'state-published-text',
      'state-published-border',
      'state-archived-bg',
      'state-archived-text',
      'state-archived-border',
      'state-attention-text',
    ],
  },
  {
    description:
      'Karty, hlavička, patička, toast, překryv dialogu, zástupný obrázek a rámeček náhledu.',
    title: 'Povrchy',
    tokens: [
      'card-bg',
      'card-border',
      'header-bg',
      'header-border',
      'footer-bg',
      'footer-text',
      'surface-inverse',
      'text-inverse',
      'toast-action',
      'toast-error',
      'overlay',
      'placeholder-bg',
      'preview-outline',
    ],
  },
  {
    description: 'Podklady upozornění (callout).',
    title: 'Upozornění',
    tokens: [
      'callout-info-bg',
      'callout-success-bg',
      'callout-warning-bg',
      'callout-error-bg',
    ],
  },
  {
    description: 'Položky navigace.',
    title: 'Navigace',
    tokens: ['nav-item-text', 'nav-item-text-hover', 'nav-item-text-active'],
  },
  {
    description:
      'Role mimo design systém. Zmizí s komponentou, která je ještě používá (odznak, tlačítka akcí životního cyklu).',
    title: 'Před redesignem',
    tokens: [
      'badge-bg',
      'badge-text',
      'badge-bg-hover',
      'badge-border',
      'action-publish',
      'action-publish-hover',
      'action-publish-active',
      'action-retract',
      'action-retract-hover',
      'action-retract-active',
      'action-archive',
      'action-archive-hover',
      'action-archive-active',
      'action-restore',
      'action-restore-hover',
      'action-restore-active',
      'action-review',
      'action-review-hover',
      'action-review-active',
    ],
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
          Barevná paleta
        </h1>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '13px',
            margin: 0,
          }}
        >
          Sémantické tokeny z <code>semantic-tokens.css</code> — jedna mapa rolí
          pro veřejný web i administraci. Každý vzorek je vykreslen živě přes{' '}
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
          Gradienty
        </h2>
        {['gradient-signature', 'gradient-signature-flip'].map((token) => (
          <div key={token} style={{ marginBottom: '16px' }}>
            <div
              style={{
                background: `var(--${token})`,
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
              --{token}
            </code>
          </div>
        ))}
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
          'Přehled sémantických barevných tokenů veřejného webu i administrace. Vzorky se čtou živě z CSS proměnných, takže vždy odpovídají stylesheetu.',
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
