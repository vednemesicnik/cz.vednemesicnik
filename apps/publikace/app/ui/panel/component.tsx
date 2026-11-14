import type { Handle } from 'remix/component'

import { routes } from '../../routes.ts'
import { VdmLogo } from '../vdm-logo/component.tsx'
import { Wordmark } from '../wordmark/component.tsx'

export type PanelSection = 'issues'

export type PanelProps = {
  /** The section the page belongs to, drawn as the active item. */
  active: PanelSection
}

/**
 * The editors-in-chief's sidebar, as `Panel.dc.html` draws it: the magazine's mark and name
 * over _Publikace_, then the sections of the app.
 *
 * Markup and class names are the design system's `AdminSidebar`, so its `components.css`
 * styles it unchanged. _Ke kontrole_ and _Nastavení_ join the list with their routes, and the
 * signed-in person and _Odhlásit se_ in the foot with sign-in (#8): a link to a page that does
 * not exist yet would be a 404.
 */
export function Panel(handle: Handle<PanelProps>) {
  return () => {
    let isIssues = handle.props.active === 'issues'

    return (
      <aside aria-label="Panel aplikace" class="vdm-sidebar">
        <div class="vdm-sidebar__head">
          <div class="vdm-sidebar__brand">
            <VdmLogo size={30} />
            <div class="vdm-sidebar__brandtext">
              <Wordmark />
              <span class="vdm-sidebar__product">Publikace</span>
            </div>
          </div>
        </div>
        <nav aria-label="Sekce aplikace" class="vdm-sidebar__nav">
          <a
            aria-current={isIssues ? 'page' : undefined}
            class={isIssues ? 'vdm-sidebar__item vdm-sidebar__item--active' : 'vdm-sidebar__item'}
            href={routes.home.href()}
          >
            Vydání
          </a>
        </nav>
      </aside>
    )
  }
}
