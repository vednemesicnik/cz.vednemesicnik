// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

type ColorToken = {
  name: string
  value: string
}

type ColorFamily = {
  title: string
  description?: string
  tokens: ColorToken[]
}

const COLOR_FAMILIES: ColorFamily[] = [
  {
    description: 'Základní černá a bílá.',
    title: 'Neutral',
    tokens: [
      { name: 'color-white', value: '#ffffff' },
      { name: 'color-black', value: '#000000' },
    ],
  },
  {
    description:
      'Sjednocená chladná neutrální škála pro veřejné rozhraní. Světlé tóny (50–300) pro pozadí a text v tmavém režimu, tmavé tóny (600–950) pro pozadí v tmavém režimu a text ve světlém režimu, střední tóny (400–500) pro ohraničení, terciární text a disabled stavy.',
    title: 'Charcoal',
    tokens: [
      { name: 'color-charcoal-50', value: '#f8fafb' },
      { name: 'color-charcoal-100', value: '#f0f4f8' },
      { name: 'color-charcoal-200', value: '#e2ebf3' },
      { name: 'color-charcoal-300', value: '#cad5e2' },
      { name: 'color-charcoal-400', value: '#9ca3af' },
      { name: 'color-charcoal-500', value: '#6b7280' },
      { name: 'color-charcoal-600', value: '#4b5563' },
      { name: 'color-charcoal-700', value: '#1e2229' },
      { name: 'color-charcoal-800', value: '#1a1d24' },
      { name: 'color-charcoal-900', value: '#121418' },
      { name: 'color-charcoal-950', value: '#0a0a0f' },
    ],
  },
  {
    description:
      'Fialově zbarvená neutrální škála pro administrátorské rozhraní. Stejné rozložení tónů jako Charcoal.',
    title: 'Midnight',
    tokens: [
      { name: 'color-midnight-50', value: '#f5f5fc' },
      { name: 'color-midnight-100', value: '#eaeaf5' },
      { name: 'color-midnight-200', value: '#d4d4e4' },
      { name: 'color-midnight-300', value: '#b2b2c8' },
      { name: 'color-midnight-400', value: '#8787a0' },
      { name: 'color-midnight-500', value: '#52526b' },
      { name: 'color-midnight-600', value: '#3d3d52' },
      { name: 'color-midnight-700', value: '#372554' },
      { name: 'color-midnight-800', value: '#2d2d44' },
      { name: 'color-midnight-900', value: '#1a1a2e' },
      { name: 'color-midnight-950', value: '#0f0f1a' },
    ],
  },
  {
    description: 'Primární UI barva pro tlačítka, odkazy a akcenty.',
    title: 'Violet',
    tokens: [
      { name: 'color-violet-100', value: '#ede9fe' },
      { name: 'color-violet-300', value: '#c4b5fd' },
      { name: 'color-violet-400', value: '#a78bfa' },
      { name: 'color-violet-500', value: '#8b5cf6' },
      { name: 'color-violet-600', value: '#7c3aed' },
      { name: 'color-violet-700', value: '#6d28d9' },
      { name: 'color-violet-800', value: '#5b21b6' },
      { name: 'color-violet-900', value: '#4c1d95' },
    ],
  },
  {
    description:
      'Sekundární barva inspirovaná logem VDM (#5cffa3). Použita pro akcenty a odznaky.',
    title: 'Emerald',
    tokens: [
      { name: 'color-emerald-100', value: '#d1fae5' },
      { name: 'color-emerald-300', value: '#6ee7b7' },
      { name: 'color-emerald-400', value: '#34d399' },
      { name: 'color-emerald-500', value: '#10b981' },
      { name: 'color-emerald-600', value: '#059669' },
      { name: 'color-emerald-700', value: '#047857' },
      { name: 'color-emerald-800', value: '#065f46' },
      { name: 'color-emerald-900', value: '#064e3b' },
    ],
  },
  {
    description: 'Použita pro warning stavy a odznaky.',
    title: 'Amber',
    tokens: [
      { name: 'color-amber-100', value: '#fef3c7' },
      { name: 'color-amber-300', value: '#fcd34d' },
      { name: 'color-amber-400', value: '#fbbf24' },
      { name: 'color-amber-500', value: '#f59e0b' },
      { name: 'color-amber-600', value: '#d97706' },
      { name: 'color-amber-700', value: '#b45309' },
      { name: 'color-amber-800', value: '#92400e' },
      { name: 'color-amber-900', value: '#78350f' },
    ],
  },
  {
    description: 'Použita pro error stavy a odznaky.',
    title: 'Rose',
    tokens: [
      { name: 'color-rose-100', value: '#ffe4e6' },
      { name: 'color-rose-300', value: '#fda4af' },
      { name: 'color-rose-400', value: '#fb7185' },
      { name: 'color-rose-500', value: '#f43f5e' },
      { name: 'color-rose-600', value: '#e11d48' },
      { name: 'color-rose-700', value: '#be123c' },
      { name: 'color-rose-800', value: '#9f1239' },
      { name: 'color-rose-900', value: '#881337' },
    ],
  },
  {
    description: 'Použita pro info stavy.',
    title: 'Azure',
    tokens: [
      { name: 'color-azure-100', value: '#dbeafe' },
      { name: 'color-azure-300', value: '#93c5fd' },
      { name: 'color-azure-400', value: '#60a5fa' },
      { name: 'color-azure-500', value: '#3b82f6' },
      { name: 'color-azure-600', value: '#2563eb' },
      { name: 'color-azure-700', value: '#1d4ed8' },
      { name: 'color-azure-800', value: '#1e40af' },
      { name: 'color-azure-900', value: '#1e3a8a' },
    ],
  },
]

function TokenName({ name }: { name: string }) {
  return (
    <>
      {name.split('-').map((part, i, arr) => (
        <span key={i}>
          {part}
          {i < arr.length - 1 && (
            <>
              -<wbr />
            </>
          )}
        </span>
      ))}
    </>
  )
}

function isLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return r * 0.299 + g * 0.587 + b * 0.114 > 160
}

function ColorSwatch({ token }: { token: ColorToken }) {
  const textColor = isLight(token.value) ? '#1f2937' : '#f9fafb'

  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: '120px',
      }}
    >
      <div
        style={{
          alignItems: 'center',
          backgroundColor: token.value,
          border: '1px solid rgba(128,128,128,0.2)',
          borderRadius: '50%',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          display: 'flex',
          height: '72px',
          justifyContent: 'center',
          width: '72px',
        }}
      >
        <span
          style={{
            color: textColor,
            fontFamily: 'monospace',
            fontSize: '9px',
            fontWeight: 700,
            textAlign: 'center',
          }}
        >
          {token.value}
        </span>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            color: '#7c3aed',
            fontFamily: 'monospace',
            fontSize: '11px',
            fontWeight: 700,
            lineHeight: '1.4',
          }}
        >
          --
          <TokenName name={token.name} />
        </div>
      </div>
    </div>
  )
}

function ColorFamily({ family }: { family: ColorFamily }) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <div
        style={{
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '20px',
          paddingBottom: '10px',
        }}
      >
        <h2
          style={{
            color: '#111827',
            fontSize: '15px',
            fontWeight: 700,
            margin: '0 0 4px',
          }}
        >
          {family.title}
        </h2>
        {family.description && (
          <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>
            {family.description}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
        {family.tokens.map((token) => (
          <ColorSwatch key={token.name} token={token} />
        ))}
      </div>
    </div>
  )
}

function PrimitiveTokens() {
  return (
    <div
      style={{
        fontFamily: 'var(--font-family, Inter), sans-serif',
        maxWidth: '900px',
        padding: '32px',
      }}
    >
      <div
        style={{
          borderBottom: '2px solid #111827',
          marginBottom: '32px',
          paddingBottom: '16px',
        }}
      >
        <h1
          style={{
            color: '#111827',
            fontSize: '20px',
            fontWeight: 700,
            marginBottom: '6px',
          }}
        >
          Primitivní tokeny — barvy
        </h1>
        <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>
          Surové pojmenované hodnoty barev z <code>primitive-tokens.css</code>.
          Tyto tokeny nemají sémantický význam a jsou referencovány z{' '}
          <code>public-tokens.css</code> a <code>admin-tokens.css</code>. V
          komponentách je nikdy nepoužívej přímo.
        </p>
      </div>

      {COLOR_FAMILIES.map((family) => (
        <ColorFamily family={family} key={family.title} />
      ))}
    </div>
  )
}

const meta: Meta = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Přehled primitivních barevných tokenů. Jedná se o surové hodnoty bez sémantického významu — základ pro public a admin tokeny.',
      },
    },
    layout: 'fullscreen',
  },
  render: () => <PrimitiveTokens />,
  tags: ['autodocs'],
  title: 'Design System/Primitive Tokens',
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Kompletní přehled všech primitivních barevných tokenů.
 * Tyto tokeny tvoří základ design systému a jsou dále referencovány
 * sémantickými tokeny ve veřejném a administrátorském rozhraní.
 */
export const Colors: Story = {}
