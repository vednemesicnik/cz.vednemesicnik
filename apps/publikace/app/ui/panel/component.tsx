import type { Handle } from 'remix/component'
import { getContext } from 'remix/middleware/async-context'

import { ProofreadingCount } from '../../middleware/proofreading-count.server.ts'
import { ReviewCount } from '../../middleware/review-count.server.ts'
import { routes } from '../../routes.ts'
import { Avatar } from '../avatar/component.tsx'
import { CsrfField } from '../csrf-field/component.tsx'
import { VdmLogo } from '../vdm-logo/component.tsx'
import { Wordmark } from '../wordmark/component.tsx'

/** `null` on a page that belongs to no section: the refusal of `10d`. */
export type PanelSection = 'issues' | 'proofreading' | 'review' | 'settings' | null

export type PanelPerson = {
  displayName: string
  email: string
  isEditor: boolean
  isProofreader: boolean
}

export type PanelProps = {
  /** The section the page belongs to, drawn as the active item. */
  active: PanelSection
  /**
   * The panel as the phone's menu over the whole screen (`11e`), inside the `<dialog>` the top
   * bar opens: rows of 44 px and _Zavřít_ in the row of the mark.
   */
  isMenu?: boolean
  /** The signed-in person, drawn in the foot; their roles decide the sections (`10d`). */
  person: PanelPerson
}

/* Inline, as `Panel.dc.html` writes them: `css()` would lose to `.vdm-sidebar__item`. */
const ITEM_WITH_COUNT = {
  alignItems: 'center',
  display: 'flex',
  gap: '8px',
  justifyContent: 'space-between',
} as const
const COUNT_STYLE = {
  color: 'var(--state-attention-text)',
  fontSize: '13px',
  fontVariantNumeric: 'tabular-nums',
  fontWeight: 600,
} as const

function itemClass(isActive: boolean): string {
  return isActive ? 'vdm-sidebar__item vdm-sidebar__item--active' : 'vdm-sidebar__item'
}

/**
 * The sidebar, as `Panel.dc.html` draws it: the magazine's mark and name over _Publikace_, the
 * sections of the app, and in the foot the signed-in person with _Odhlásit se_.
 *
 * A proofreader who is not an editor-in-chief has one section, _Korektura_, and none of the others,
 * not even greyed out: they never open them (`10d`). An editor-in-chief has _Korektura_ after _Ke
 * kontrole_.
 *
 * Markup and class names are the design system's `AdminSidebar`, so its `components.css`
 * styles it unchanged. _Odhlásit se_ is a button in a form, `POST /sign-out`, never a link
 * (`03`, rozhodnuto 17. 11. 2026); `.vdm-sidebar__form` gives it the row's look. _Ke kontrole_
 * carries the number of its cards, read from the request the panel is drawn in, and none when
 * the queue is empty. _Korektura_ carries the articles waiting for a proofreader, only for a
 * proofreader: the handover waits on them, not on the editors-in-chief (`15b`).
 */
export function Panel(handle: Handle<PanelProps>) {
  return () => {
    let { active, isMenu = false, person } = handle.props
    let reviewCount = getContext().get(ReviewCount)
    let proofreadingCount = getContext().get(ProofreadingCount)
    let proofreading = (
      <a
        aria-current={active === 'proofreading' ? 'page' : undefined}
        class={itemClass(active === 'proofreading')}
        href={routes.proofreading.index.href()}
        style={ITEM_WITH_COUNT}
      >
        Korektura
        {person.isProofreader && proofreadingCount > 0 ? (
          <span style={COUNT_STYLE}>{String(proofreadingCount)}</span>
        ) : null}
      </a>
    )

    return (
      <aside
        aria-label="Panel aplikace"
        class={isMenu ? 'vdm-sidebar vdm-sidebar--menu' : 'vdm-sidebar'}
      >
        <div class="vdm-sidebar__head">
          <div class="vdm-sidebar__brand">
            <VdmLogo size={isMenu ? 28 : 30} />
            <div class="vdm-sidebar__brandtext">
              <Wordmark />
              <span class="vdm-sidebar__product">Publikace</span>
            </div>
            {/* `method="dialog"` closes the dialog it is in with no script, and the browser
                runtime leaves such a form alone. */}
            {isMenu ? (
              <form class="vdm-sidebar__close" method="dialog">
                <button class="vdm-btn vdm-btn--ghost vdm-btn--sm" type="submit">
                  Zavřít
                </button>
              </form>
            ) : null}
          </div>
        </div>
        <nav aria-label="Sekce aplikace" class="vdm-sidebar__nav">
          {person.isEditor ? (
            <>
              <a
                aria-current={active === 'issues' ? 'page' : undefined}
                class={itemClass(active === 'issues')}
                href={routes.home.href()}
              >
                Vydání
              </a>
              <a
                aria-current={active === 'review' ? 'page' : undefined}
                class={itemClass(active === 'review')}
                href={routes.review.index.href()}
                style={ITEM_WITH_COUNT}
              >
                Ke kontrole
                {reviewCount > 0 ? <span style={COUNT_STYLE}>{String(reviewCount)}</span> : null}
              </a>
              {proofreading}
              <span class="vdm-sidebar__sep" role="separator"></span>
              <a
                aria-current={active === 'settings' ? 'page' : undefined}
                class={itemClass(active === 'settings')}
                href={routes.settings.index.href()}
              >
                Nastavení
              </a>
            </>
          ) : (
            proofreading
          )}
        </nav>
        <div class="vdm-sidebar__foot">
          <div class="vdm-sidebar__user">
            <Avatar name={person.displayName} size={32} />
            <div class="vdm-sidebar__usertext">
              <span class="vdm-sidebar__username">{person.displayName}</span>
              <span class="vdm-sidebar__role">{person.email}</span>
            </div>
          </div>
          <form action={routes.auth.signOut.href()} class="vdm-sidebar__form" method="post">
            <CsrfField />
            <button class="vdm-sidebar__link vdm-sidebar__row" type="submit">
              Odhlásit se
            </button>
          </form>
        </div>
      </aside>
    )
  }
}
