// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

const SIZES = [
  { fs: '0.75rem', lh: '1.6', name: 'xs', power: null },
  { fs: '0.875rem', lh: '1.5', name: 'sm', power: null },
  { fs: '1rem', lh: '1.5', name: 'md', power: null },
  { lh: '1.5', name: 'lg', power: 1 },
  { lh: '1.4', name: 'xl', power: 2 },
  { lh: '1.35', name: '2xl', power: 3 },
  { lh: '1.3', name: '3xl', power: 4 },
  { lh: '1.25', name: '4xl', power: 5 },
  { lh: '1.2', name: '5xl', power: 6 },
]

function computeFs(
  power: number | null,
  fs: string | undefined,
  scaleRatio: number,
): string {
  if (power === null) return fs ?? '1rem'
  return `${(scaleRatio ** power).toFixed(3)}rem`
}

type Props = {
  fontWeight: 400 | 500 | 600 | 700
  scaleRatio: 1.125 | 1.25
}

function TypographyRow({
  name,
  fs,
  lh,
  fontWeight,
}: {
  name: string
  fs: string
  lh: string
  fontWeight: number
}) {
  return (
    <div
      style={{
        alignItems: 'start',
        borderBottom: '1px solid #e5e7eb',
        display: 'grid',
        gap: '32px',
        gridTemplateColumns: '200px 1fr',
        padding: '20px 0',
      }}
    >
      <div style={{ paddingTop: '2px' }}>
        <div
          style={{
            color: '#7c3aed',
            fontFamily: 'monospace',
            fontSize: '13px',
            fontWeight: 700,
            marginBottom: '4px',
          }}
        >
          {name}
        </div>
        <div
          style={{
            color: '#9ca3af',
            fontFamily: 'monospace',
            fontSize: '11px',
            lineHeight: '1.6',
          }}
        >
          <span style={{ display: 'block' }}>
            --font-size-{name} <span style={{ color: '#6b7280' }}>({fs})</span>
          </span>
          <span style={{ display: 'block' }}>
            --line-height-{name}{' '}
            <span style={{ color: '#6b7280' }}>({lh})</span>
          </span>
        </div>
      </div>

      <div
        style={{
          borderBottom: '1px dashed #a78bfa',
          borderTop: '1px dashed #a78bfa',
          fontSize: fs,
          lineHeight: `var(--line-height-${name})`,
        }}
      >
        <span
          style={{
            borderBottom: '1px dashed #10b981',
            borderTop: '1px dashed #10b981',
            color: 'var(--text-primary, #111827)',
            fontWeight,
          }}
        >
          Příliš žluťoučký kůň úpěl ďábelské ódy
        </span>
      </div>
    </div>
  )
}

function TypographyScale({ fontWeight, scaleRatio }: Props) {
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
          Typografická škála
        </h1>
        <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>
          Velikosti textu xs–5xl s příslušnou výškou řádku (line-height).
          Čárkované linky znázorňují hranice řádkového prostoru.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gap: '32px',
          gridTemplateColumns: '200px 1fr',
          marginBottom: '8px',
          padding: '0 0 8px',
        }}
      >
        <div
          style={{
            color: '#9ca3af',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Token
        </div>
        <div
          style={{
            color: '#9ca3af',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Ukázka textu
        </div>
      </div>

      {SIZES.map((size) => (
        <TypographyRow
          fontWeight={fontWeight}
          fs={computeFs(
            size.power,
            'fs' in size ? size.fs : undefined,
            scaleRatio,
          )}
          key={size.name}
          lh={size.lh}
          name={size.name}
        />
      ))}
    </div>
  )
}

const meta: Meta<Props> = {
  argTypes: {
    fontWeight: {
      control: 'select',
      description: 'Tloušťka písma (font-weight)',
      options: [400, 500, 600, 700],
      table: {
        defaultValue: { summary: '400' },
        type: {
          detail: '400 regular · 500 medium · 600 semibold · 700 bold',
          summary: '400 | 500 | 600 | 700',
        },
      },
    },
    scaleRatio: {
      control: 'select',
      description: 'Poměr typografické škály (type-scale-ratio)',
      options: [1.125, 1.25],
      table: {
        defaultValue: { summary: '1.125' },
        type: {
          detail: '1.125 major second (mobil) · 1.25 major third (desktop)',
          summary: '1.125 | 1.25',
        },
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
          'Přehled typografické škály projektu. Každý řádek zobrazuje vzorek textu ve skutečné velikosti s vizualizací line-height pomocí čárkovaných linek.',
      },
    },
    layout: 'fullscreen',
  },
  render: (args) => <TypographyScale {...args} />,
  tags: ['autodocs'],
  title: 'Design System/Typography',
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Celá typografická škála od xs do 5xl.
 * Na mobilních zařízeních (<768px) se používá scale ratio major second (1.125),
 * na větších obrazovkách major third (1.25).
 */
export const Scale: Story = {
  args: {
    fontWeight: 400,
    scaleRatio: 1.125,
  },
}
