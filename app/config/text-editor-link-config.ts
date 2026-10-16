import type { LinkOptions } from '@tiptap/extension-link'

// Links in `TextEditor` and `CaptionEditor`.
export const TEXT_EDITOR_LINK_CONFIG = {
  autolink: true,
  defaultProtocol: 'https',
  enableClickSelection: true,
  HTMLAttributes: { rel: 'noopener', target: '_blank' },
  linkOnPaste: true,
  openOnClick: false,
  protocols: ['mailto', 'tel'],
} satisfies Partial<LinkOptions>
