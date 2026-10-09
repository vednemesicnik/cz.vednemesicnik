import type { ComponentProps, JSX } from 'react'
import { BaseHyperlink } from '~/components/base-hyperlink'
import { BaseHyperlinkIcon } from '~/components/base-hyperlink-icon'
import { OpenInNewIcon } from '~/components/icons/open-in-new-icon'

type Props = ComponentProps<'a'>

/**
 * Hyperlink component renders a `BaseHyperlink` component — a link that opens a new
 * tab — with the new-tab icon after its text. The icon is hidden from screen readers;
 * they hear „(otevře se v nové záložce)“ instead (design tyxr2jqk: one icon for every
 * link that opens a new tab; wording from copy thread 7uhu5pze).
 *
 * @param {Object} props - The properties object.
 * @param {React.ReactNode} props.children - The content to be displayed inside the anchor element.
 * @param {Object} [props.rest] - Additional properties to be passed to the anchor element.
 * @returns {JSX.Element} The rendered anchor element with the new-tab icon.
 */
export const Hyperlink = ({ children, ...rest }: Props): JSX.Element => {
  return (
    <BaseHyperlink {...rest}>
      {children}
      <BaseHyperlinkIcon>
        <OpenInNewIcon decorative />
      </BaseHyperlinkIcon>
      <span className={'screen-reader-only'}> (otevře se v nové záložce)</span>
    </BaseHyperlink>
  )
}
