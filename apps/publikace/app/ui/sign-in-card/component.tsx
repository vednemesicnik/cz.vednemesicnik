import type { Handle, RemixNode } from 'remix/component'

import { VdmLogo } from '../vdm-logo/component.tsx'
import { Wordmark } from '../wordmark/component.tsx'

export type SignInCardProps = {
  children?: RemixNode
  /** The magazine's name between the mark and the title, only on the sign-in itself (`10a`). */
  hasWordmark?: boolean
  title: string
}

/**
 * The design system's `AdminSignInCard` with `layout="auto"`: a card from 768 px, and below it
 * the same content without the frame (`10c`), which the design system's own media query does.
 * The children are the card's parts — a Callout, buttons, sentences — 16 px apart.
 */
export function SignInCard(handle: Handle<SignInCardProps>) {
  return () => {
    let { children, hasWordmark = false, title } = handle.props
    let heading = <h1 class="vdm-signin__title">{title}</h1>

    return (
      <div class={hasWordmark ? 'vdm-signin vdm-signin--wordmark' : 'vdm-signin'}>
        <div class="vdm-signin__head">
          <VdmLogo size={40} />
          {hasWordmark ? (
            <div class="vdm-signin__names">
              <Wordmark as="p" size={28} weight={700} />
              {heading}
            </div>
          ) : (
            heading
          )}
        </div>
        {children}
      </div>
    )
  }
}
