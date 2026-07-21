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
    description: 'Základní povrchy administračního rozhraní.',
    title: 'Pozadí',
    tokens: [
      { dark: '#0f0f1a', light: '#ffffff', name: 'admin-bg-primary' },
      { dark: '#1a1a2e', light: '#f8fafc', name: 'admin-bg-secondary' },
      { dark: '#2d2d44', light: '#f1f5f9', name: 'admin-bg-tertiary' },
      { dark: '#372554', light: '#f3f0ff', name: 'admin-bg-hover' },
      { dark: '#0f0f1a', light: '#f8f9fa', name: 'admin-bg-disabled' },
    ],
  },
  {
    description: 'Ohraničení prvků v různých stavech.',
    title: 'Ohraničení',
    tokens: [
      { dark: '#3d3d52', light: '#cbd5e1', name: 'admin-border' },
      { dark: '#52526b', light: '#94a3b8', name: 'admin-border-hover' },
      { dark: '#64748b', light: '#cbd5e1', name: 'admin-border-strong' },
    ],
  },
  {
    description: 'Barvy textu pro různé úrovně důležitosti.',
    title: 'Text',
    tokens: [
      { dark: '#f1f5f9', light: '#0f172a', name: 'admin-text-primary' },
      { dark: '#cbd5e1', light: '#64748b', name: 'admin-text-secondary' },
      { dark: '#94a3b8', light: '#94a3b8', name: 'admin-text-tertiary' },
    ],
  },
  {
    description: 'Primární UI barva administrace. Purple.',
    title: 'Purple (primární)',
    tokens: [
      { dark: '#8b5cf6', light: '#7c3aed', name: 'admin-purple' },
      { dark: '#7c3aed', light: '#6d28d9', name: 'admin-purple-hover' },
      { dark: '#6d28d9', light: '#5b21b6', name: 'admin-purple-active' },
    ],
  },
  {
    description: 'Sekundární barva administrace. Amber.',
    title: 'Amber (sekundární)',
    tokens: [
      { dark: '#fbbf24', light: '#f59e0b', name: 'admin-amber' },
      { dark: '#f59e0b', light: '#d97706', name: 'admin-amber-hover' },
      { dark: '#d97706', light: '#b45309', name: 'admin-amber-active' },
    ],
  },
  {
    description: 'Stavové barvy pro zpětnou vazbu uživateli.',
    title: 'Sémantické',
    tokens: [
      { dark: '#34d399', light: '#10b981', name: 'admin-success' },
      { dark: '#fb7185', light: '#e11d48', name: 'admin-error' },
      { dark: '#fdba74', light: '#fb923c', name: 'admin-warning' },
    ],
  },
  {
    description:
      'Barvy odznaků pro stavy obsahu: koncept, publikováno, archivováno.',
    title: 'Stavy obsahu',
    tokens: [
      { dark: '#78350f', light: '#fef3c7', name: 'admin-state-draft-bg' },
      { dark: '#fcd34d', light: '#92400e', name: 'admin-state-draft-text' },
      {
        dark: '#064e3b',
        light: '#d1fae5',
        name: 'admin-state-published-bg',
      },
      {
        dark: '#6ee7b7',
        light: '#065f46',
        name: 'admin-state-published-text',
      },
      { dark: '#7f1d1d', light: '#fee2e2', name: 'admin-state-archived-bg' },
      {
        dark: '#fca5a5',
        light: '#991b1b',
        name: 'admin-state-archived-text',
      },
    ],
  },
  {
    description:
      'Barvy akčních tlačítek pro přechody stavů obsahu (publikovat, stáhnout, archivovat, obnovit, přezkoumat).',
    title: 'Akční tlačítka',
    tokens: [
      { dark: '#059669', light: '#10b981', name: 'admin-action-publish' },
      {
        dark: '#047857',
        light: '#059669',
        name: 'admin-action-publish-hover',
      },
      {
        dark: '#065f46',
        light: '#047857',
        name: 'admin-action-publish-active',
      },
      { dark: '#d97706', light: '#f59e0b', name: 'admin-action-retract' },
      {
        dark: '#b45309',
        light: '#d97706',
        name: 'admin-action-retract-hover',
      },
      {
        dark: '#92400e',
        light: '#b45309',
        name: 'admin-action-retract-active',
      },
      { dark: '#e11d48', light: '#f43f5e', name: 'admin-action-archive' },
      {
        dark: '#be123c',
        light: '#e11d48',
        name: 'admin-action-archive-hover',
      },
      {
        dark: '#9f1239',
        light: '#be123c',
        name: 'admin-action-archive-active',
      },
      { dark: '#d97706', light: '#f59e0b', name: 'admin-action-restore' },
      {
        dark: '#b45309',
        light: '#d97706',
        name: 'admin-action-restore-hover',
      },
      {
        dark: '#92400e',
        light: '#b45309',
        name: 'admin-action-restore-active',
      },
      { dark: '#2563eb', light: '#3b82f6', name: 'admin-action-review' },
      {
        dark: '#1d4ed8',
        light: '#2563eb',
        name: 'admin-action-review-hover',
      },
      {
        dark: '#1e40af',
        light: '#1d4ed8',
        name: 'admin-action-review-active',
      },
    ],
  },
  {
    description: 'Nebezpečné akce (smazání, nenávratné operace).',
    title: 'Danger',
    tokens: [
      { dark: '#dc2626', light: '#ef4444', name: 'admin-danger' },
      { dark: '#b91c1c', light: '#dc2626', name: 'admin-danger-hover' },
      { dark: '#991b1b', light: '#b91c1c', name: 'admin-danger-active' },
      { dark: '#ffffff', light: '#ffffff', name: 'admin-button-text' },
      {
        dark: '#f1f5f9',
        light: '#0f172a',
        name: 'admin-button-text-secondary',
      },
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

function AdminColorPalette({ colorScheme }: Props) {
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
          Barevná paleta — Administrace
        </h1>
        <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>
          Design tokeny z <code>admin-design-tokens.css</code>. Každá barva
          podporuje světlý i tmavý režim přes CSS funkci{' '}
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
          'Přehled barevné palety administračního rozhraní. Barvy jsou organizovány do skupin dle účelu včetně stavů obsahu a akčních tlačítek. Přepněte barevné schéma pro zobrazení světlých nebo tmavých hodnot.',
      },
    },
    layout: 'fullscreen',
  },
  render: (args) => <AdminColorPalette {...args} />,
  tags: ['autodocs'],
  title: 'Design System/Admin Colors',
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Celá barevná paleta administračního design systému.
 * Zahrnuje stavové barvy obsahu (koncept/publikováno/archivováno)
 * a akční tlačítka pro přechody mezi stavy.
 */
export const Palette: Story = {
  args: {
    colorScheme: 'light',
  },
}
