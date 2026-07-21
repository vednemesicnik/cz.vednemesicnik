// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

type ColorToken = {
  name: string
  light: string
  dark: string
}

type ColorGroup = {
  title: string
  description?: string
  tokens: ColorToken[]
}

const COLOR_GROUPS: ColorGroup[] = [
  {
    description: 'Základní povrchy stránek a sekcí.',
    title: 'Pozadí',
    tokens: [
      { dark: '#0a0a0f', light: '#ffffff', name: 'bg-primary' },
      { dark: '#121418', light: '#f8fafb', name: 'bg-secondary' },
      { dark: '#1a1d24', light: '#f0f4f8', name: 'bg-tertiary' },
      { dark: '#4c1d95', light: '#ede9fe', name: 'bg-accent' },
      { dark: '#1e2229', light: '#f5f9fc', name: 'bg-hover' },
      { dark: '#18181b', light: '#f5f5f5', name: 'bg-disabled' },
    ],
  },
  {
    description: 'Ohraničení prvků v různých stavech.',
    title: 'Ohraničení',
    tokens: [
      { dark: '#2d3139', light: '#e5e7eb', name: 'border' },
      { dark: '#3d424d', light: '#cbd5e1', name: 'border-hover' },
      { dark: '#52576b', light: '#9ca3af', name: 'border-strong' },
      { dark: '#a78bfa', light: '#8b5cf6', name: 'border-accent' },
    ],
  },
  {
    description: 'Barvy textu pro různé úrovně důležitosti.',
    title: 'Text',
    tokens: [
      { dark: '#f9fafb', light: '#111827', name: 'text-primary' },
      { dark: '#d1d5db', light: '#4b5563', name: 'text-secondary' },
      { dark: '#9ca3af', light: '#9ca3af', name: 'text-tertiary' },
      { dark: '#ffffff', light: '#ffffff', name: 'text-on-accent' },
    ],
  },
  {
    description:
      'Primární UI barva pro tlačítka, odkazy a akcenty. Violet/Purple.',
    title: 'Violet (primární)',
    tokens: [
      { dark: '#a78bfa', light: '#8b5cf6', name: 'violet' },
      { dark: '#8b5cf6', light: '#7c3aed', name: 'violet-hover' },
      { dark: '#7c3aed', light: '#6d28d9', name: 'violet-active' },
      { dark: '#4c1d95', light: '#ede9fe', name: 'violet-light' },
    ],
  },
  {
    description:
      'Sekundární barva inspirovaná logem VDM (#5cffa3). Emerald/Green.',
    title: 'Emerald (sekundární)',
    tokens: [
      { dark: '#34d399', light: '#10b981', name: 'emerald' },
      { dark: '#10b981', light: '#059669', name: 'emerald-hover' },
      { dark: '#059669', light: '#047857', name: 'emerald-active' },
      { dark: '#064e3b', light: '#d1fae5', name: 'emerald-light' },
      { dark: '#34d399', light: '#5cffa3', name: 'emerald-bright' },
    ],
  },
  {
    description: 'Stavové barvy pro zpětnou vazbu uživateli.',
    title: 'Sémantické',
    tokens: [
      { dark: '#34d399', light: '#10b981', name: 'success' },
      { dark: '#f87171', light: '#ef4444', name: 'error' },
      { dark: '#fbbf24', light: '#f59e0b', name: 'warning' },
      { dark: '#60a5fa', light: '#3b82f6', name: 'info' },
    ],
  },
  {
    description: 'Barvy odkazů včetně stavů.',
    title: 'Odkazy',
    tokens: [
      { dark: '#a78bfa', light: '#8b5cf6', name: 'link' },
      { dark: '#8b5cf6', light: '#7c3aed', name: 'link-hover' },
      { dark: '#7c3aed', light: '#6d28d9', name: 'link-visited' },
    ],
  },
  {
    description: 'Barvy odznaků pro kategorie a tagy článků.',
    title: 'Odznaky (badges)',
    tokens: [
      { dark: '#064e3b', light: '#d1fae5', name: 'badge-emerald-bg' },
      { dark: '#6ee7b7', light: '#065f46', name: 'badge-emerald-text' },
      { dark: '#4c1d95', light: '#ede9fe', name: 'badge-violet-bg' },
      { dark: '#c4b5fd', light: '#6d28d9', name: 'badge-violet-text' },
      { dark: '#78350f', light: '#fef3c7', name: 'badge-amber-bg' },
      { dark: '#fcd34d', light: '#92400e', name: 'badge-amber-text' },
      { dark: '#881337', light: '#ffe4e6', name: 'badge-rose-bg' },
      { dark: '#fda4af', light: '#9f1239', name: 'badge-rose-text' },
      { dark: '#581c87', light: '#f3e8ff', name: 'badge-violet-bg' },
      { dark: '#d8b4fe', light: '#6b21a8', name: 'badge-violet-text' },
    ],
  },
  {
    description: 'Barvy tlačítek pro všechny varianty.',
    title: 'Tlačítka',
    tokens: [
      { dark: '#a78bfa', light: '#8b5cf6', name: 'button-primary-bg' },
      { dark: '#8b5cf6', light: '#7c3aed', name: 'button-primary-bg-hover' },
      { dark: '#7c3aed', light: '#6d28d9', name: 'button-primary-bg-active' },
      { dark: '#ffffff', light: '#ffffff', name: 'button-primary-text' },
      { dark: '#34d399', light: '#10b981', name: 'button-secondary-bg' },
      { dark: '#10b981', light: '#059669', name: 'button-secondary-bg-hover' },
      { dark: '#059669', light: '#047857', name: 'button-secondary-bg-active' },
      { dark: '#ffffff', light: '#ffffff', name: 'button-secondary-text' },
      { dark: '#a78bfa', light: '#8b5cf6', name: 'button-outlined-border' },
      { dark: '#a78bfa', light: '#7c3aed', name: 'button-outlined-text' },
      { dark: '#4c1d95', light: '#ede9fe', name: 'button-outlined-bg-hover' },
      { dark: '#d1d5db', light: '#4b5563', name: 'button-ghost-text' },
      { dark: '#1f2937', light: '#f3f4f6', name: 'button-ghost-bg-hover' },
    ],
  },
  {
    description: 'Barvy pro navigaci, header, footer a karty.',
    title: 'Komponenty',
    tokens: [
      { dark: '#18181b', light: '#ffffff', name: 'card-bg' },
      { dark: '#27272a', light: '#e5e7eb', name: 'card-border' },
      { dark: '#0a0a0f', light: '#ffffff', name: 'header-bg' },
      { dark: '#27272a', light: '#e5e7eb', name: 'header-border' },
      { dark: '#d1d5db', light: '#4b5563', name: 'nav-item-text' },
      { dark: '#f9fafb', light: '#111827', name: 'nav-item-text-hover' },
      { dark: '#a78bfa', light: '#7c3aed', name: 'nav-item-text-active' },
      { dark: '#121418', light: '#f8fafb', name: 'footer-bg' },
      { dark: '#9ca3af', light: '#6b7280', name: 'footer-text' },
      { dark: '#2d3139', light: '#e5e7eb', name: 'footer-border' },
    ],
  },
]

type Props = {
  colorScheme: 'light' | 'dark'
}

function isLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return r * 0.299 + g * 0.587 + b * 0.114 > 160
}

function ColorSwatch({
  token,
  colorScheme,
}: {
  token: ColorToken
  colorScheme: 'light' | 'dark'
}) {
  const value = colorScheme === 'light' ? token.light : token.dark
  const textColor = isLight(value) ? '#1f2937' : '#f9fafb'

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
          backgroundColor: value,
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
          {value}
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
            wordBreak: 'break-all',
          }}
        >
          --{token.name}
        </div>
        <div
          style={{
            color: '#9ca3af',
            fontFamily: 'monospace',
            fontSize: '10px',
            marginTop: '2px',
          }}
        >
          {colorScheme === 'light' ? '☀︎ light' : '☾ dark'}
        </div>
      </div>
    </div>
  )
}

function ColorGroup({
  group,
  colorScheme,
}: {
  group: ColorGroup
  colorScheme: 'light' | 'dark'
}) {
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
          {group.title}
        </h2>
        {group.description && (
          <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>
            {group.description}
          </p>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '24px',
        }}
      >
        {group.tokens.map((token, index) => (
          <ColorSwatch
            colorScheme={colorScheme}
            key={`${token.name}-${index}`}
            token={token}
          />
        ))}
      </div>
    </div>
  )
}

function ColorPalette({ colorScheme }: Props) {
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
          Barevná paleta
        </h1>
        <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>
          Design tokeny z <code>design-tokens.css</code>. Každá barva podporuje
          světlý i tmavý režim přes CSS funkci{' '}
          <code>light-dark(light, dark)</code>.
        </p>
      </div>

      {COLOR_GROUPS.map((group) => (
        <ColorGroup colorScheme={colorScheme} group={group} key={group.title} />
      ))}
    </div>
  )
}

const meta: Meta<Props> = {
  argTypes: {
    colorScheme: {
      control: 'select',
      description: 'Barevné schéma (světlý / tmavý režim)',
      options: ['light', 'dark'],
      table: {
        defaultValue: { summary: 'light' },
        type: { summary: 'light | dark' },
      },
    },
  },
  parameters: {
    controls: {
      disableSaveFromUI: true,
    },
    docs: {
      description: {
        component:
          'Přehled barevné palety projektu. Barvy jsou organizovány do skupin dle účelu. Přepněte barevné schéma pro zobrazení světlých nebo tmavých hodnot.',
      },
    },
    layout: 'fullscreen',
  },
  render: (args) => <ColorPalette {...args} />,
  tags: ['autodocs'],
  title: 'Design System/Colors',
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Celá barevná paleta design systému.
 * Barvy využívají CSS funkci light-dark() pro automatické přizpůsobení světlému
 * nebo tmavému režimu. Pomocí ovládacího prvku výše přepínejte mezi hodnotami.
 */
export const Palette: Story = {
  args: {
    colorScheme: 'light',
  },
}
