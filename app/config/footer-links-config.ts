import { href } from 'react-router'
import { socialSitesConfig } from '~/config/social-sites-config'

type FooterLink =
  | { kind: 'internal'; label: string; to: string }
  | { kind: 'external'; label: string; href: string }

type FooterColumn = {
  title: string
  links: ReadonlyArray<FooterLink>
}

/**
 * The public footer's link columns, in display order (design 10a).
 * Internal targets go through `href()`, so a removed route fails the typecheck.
 */
export const footerColumns: ReadonlyArray<FooterColumn> = [
  {
    links: [
      { kind: 'internal', label: 'Články', to: href('/articles') },
      { kind: 'internal', label: 'Podcasty', to: href('/podcasts') },
      { kind: 'internal', label: 'Archiv', to: href('/archive') },
      { kind: 'internal', label: 'Redakce', to: href('/editorial-board') },
      { kind: 'internal', label: 'Rubriky', to: href('/articles/categories') },
      { kind: 'internal', label: 'Štítky', to: href('/articles/tags') },
    ],
    title: 'Časopis',
  },
  {
    links: [
      { kind: 'internal', label: 'O spolku', to: href('/organization') },
      { kind: 'internal', label: 'Dotace', to: href('/grants') },
    ],
    title: 'Spolek',
  },
  {
    links: [
      { kind: 'internal', label: 'Technická podpora', to: href('/support') },
    ],
    title: 'Pomoc',
  },
  {
    links: [
      { kind: 'external', ...socialSitesConfig.facebook },
      { kind: 'external', ...socialSitesConfig.instagram },
    ],
    title: 'Sledujte nás',
  },
]
