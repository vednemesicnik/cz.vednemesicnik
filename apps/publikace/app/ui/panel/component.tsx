import type { Handle } from 'remix/component'

import { routes } from '../../routes.ts'
import { Avatar } from '../avatar/component.tsx'
import { CsrfField } from '../csrf-field/component.tsx'
import { VdmLogo } from '../vdm-logo/component.tsx'
import { Wordmark } from '../wordmark/component.tsx'

export type PanelSection = 'issues' | 'settings'

export type PanelPerson = {
  displayName: string
  email: string
}

export type PanelProps = {
  /** The section the page belongs to, drawn as the active item. */
  active: PanelSection
  /**
   * The panel as the phone's menu over the whole screen (`11e`), inside the `<dialog>` the top
   * bar opens: rows of 44 px and _Zavřít_ in the row of the mark.
   */
  isMenu?: boolean
  /** The signed-in editor-in-chief, drawn in the foot. */
  person: PanelPerson
}

function itemClass(isActive: boolean): string {
  return isActive ? 'vdm-sidebar__item vdm-sidebar__item--active' : 'vdm-sidebar__item'
}

/**
 * The editors-in-chief's sidebar, as `Panel.dc.html` draws it: the magazine's mark and name
 * over _Publikace_, the sections of the app, and in the foot the signed-in person with
 * _Odhlásit se_.
 *
 * Markup and class names are the design system's `AdminSidebar`, so its `components.css`
 * styles it unchanged. _Odhlásit se_ is a button in a form, `POST /sign-out`, never a link
 * (`03`, rozhodnuto 17. 11. 2026); `.vdm-sidebar__form` gives it the row's look. _Ke kontrole_
 * joins the list with its route: a link to a page that does not exist would be a 404.
 */
export function Panel(handle: Handle<PanelProps>) {
  return () => {
    let { active, isMenu = false, person } = handle.props

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
          <a
            aria-current={active === 'issues' ? 'page' : undefined}
            class={itemClass(active === 'issues')}
            href={routes.home.href()}
          >
            Vydání
          </a>
          <span class="vdm-sidebar__sep" role="separator"></span>
          <a
            aria-current={active === 'settings' ? 'page' : undefined}
            class={itemClass(active === 'settings')}
            href={routes.settings.index.href()}
          >
            Nastavení
          </a>
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
