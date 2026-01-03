import type { ComponentProps, JSX } from 'react'
import { BaseHyperlink } from '~/components/base-hyperlink'
import { BaseHyperlinkIcon } from '~/components/base-hyperlink-icon'
import { OpenInNewIcon } from '~/components/icons/open-in-new-icon'

type Props = ComponentProps<'a'>

/**
 * Hyperlink component renders a `BaseHyperlink` component with optional external link icon.
 *
 * @param {Object} props - The properties object.
 * @param {React.ReactNode} props.children - The content to be displayed inside the anchor element.
 * @param {Object} [props.rest] - Additional properties to be passed to the anchor element.
 * @returns {JSX.Element} The rendered anchor element with external link icon.
 */
export const Hyperlink = ({ children, ...rest }: Props): JSX.Element => {
  return (
    <BaseHyperlink {...rest}>
      {children}
      <BaseHyperlinkIcon>
        <OpenInNewIcon />
      </BaseHyperlinkIcon>
    </BaseHyperlink>
  )
}
