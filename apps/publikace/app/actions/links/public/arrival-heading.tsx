import type { Handle } from 'remix/component'
import { clientEntry, ref } from 'remix/component'

/**
 * The heading of a page that took the place of a sent form (`20d`, `21c`), focused once it
 * arrives. The button that sent the form is gone with it, so without this the runtime has nothing
 * to give focus back to and the browser drops it on the document: the reader hears no result.
 *
 * `tabindex="-1"` makes the heading focusable from the script without putting it in the tab
 * order. Without the runtime it is a plain heading and the page loads from its top.
 */
export const ArrivalHeading = clientEntry(
  import.meta.url,
  function ArrivalHeading(handle: Handle<{ text: string }>) {
    let heading: HTMLElement | null = null

    /* After the commit, so it comes after the runtime puts back the focus it saved. */
    handle.queueTask(() => heading?.focus())

    return () => (
      <h1
        class="vdm-page-title"
        mix={ref((node) => {
          heading = node as HTMLElement
        })}
        style={{ margin: 0 }}
        tabIndex={-1}
      >
        {handle.props.text}
      </h1>
    )
  },
)
