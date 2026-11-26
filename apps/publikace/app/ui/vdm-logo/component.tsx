import type { Handle } from 'remix/component'

export type VdmLogoProps = {
  /** Width and height in pixels; the mark is square. */
  size: number
}

/*
 * The design system's `VdmLogo`, default variant, in `components/brand/VdmLogo.jsx`. The
 * colours belong to the mark rather than to the token map, and each is `light-dark()` with the
 * design system's two values, so the mark follows `color-scheme` without a theme of its own.
 */
const MAIN = 'light-dark(#5cffa3, #34d399)'
const GRADIENT_START = 'light-dark(#0068b8, #0284c7)'
const GRADIENT_MID = 'light-dark(#43d6a9, #14b8a6)'
const GRADIENT_END = 'light-dark(#5cffa3, #6ee7b7)'

/**
 * The magazine's square "V" mark, as decoration.
 *
 * Hidden from a screen reader: it always stands beside the wordmark, which names the magazine
 * once, and a labelled mark would have the name read twice.
 */
export function VdmLogo(handle: Handle<VdmLogoProps>) {
  let gradientId = `vdm-logo-gradient-${handle.id}`

  return () => {
    let { size } = handle.props

    return (
      <svg
        aria-hidden="true"
        height={size}
        style={{ display: 'block', flex: 'none' }}
        viewBox="0 0 4167 4167"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            gradientTransform="matrix(2400 -2900 2900 2400 833.333 3533.33)"
            gradientUnits="userSpaceOnUse"
            id={gradientId}
            x1="0"
            x2="1"
            y1="0"
            y2="0"
          >
            <stop offset="0" style={{ stopColor: GRADIENT_START }} />
            <stop offset=".52" style={{ stopColor: GRADIENT_MID }} />
            <stop offset="1" style={{ stopColor: GRADIENT_END }} />
          </linearGradient>
        </defs>
        <path d="m2533.33 633.333h700v2900h-700z" fill={`url(#${gradientId})`} />
        <g style={{ fill: MAIN }}>
          <path d="m833.333 633.333h800l1600 2700v200h-700z" />
          <path d="m166.644 4166.67c-92.035 0-166.644-74.609-166.644-166.644v-3833.38c0-92.035 74.609-166.644 166.644-166.644h3833.38c92.035 0 166.644 74.609 166.644 166.644v3833.38c0 92.035-74.609 166.644-166.644 166.644-670.003 0-3163.38 0-3833.38 0zm3666.69-300c8.841 0 17.319-3.512 23.571-9.763 6.251-6.252 9.763-14.73 9.763-23.571v-3500c0-8.84-3.512-17.319-9.763-23.57-6.252-6.251-14.73-9.763-23.571-9.763-339.251 0-3160.75 0-3500 0-8.84 0-17.319 3.512-23.57 9.763s-9.763 14.73-9.763 23.57v3500c0 8.841 3.512 17.319 9.763 23.571 6.251 6.251 14.73 9.763 23.57 9.763z" />
        </g>
      </svg>
    )
  }
}
