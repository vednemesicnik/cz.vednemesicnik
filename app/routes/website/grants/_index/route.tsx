// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'
import { ContentLink } from '~/components/content-link'
import { ContentLinkFooter } from '~/components/content-link-footer'
import { ContentLinkTitle } from '~/components/content-link-title'
import { ContentList } from '~/components/content-list'
import { ContentListItem } from '~/components/content-list-item'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { Page } from '~/components/page'
import { Paragraph } from '~/components/paragraph'
import { grants } from '~/data/grants'

export { meta } from './_meta'

export default function RouteComponent() {
  return (
    <Page>
      <HeadlineGroup>
        <Headline>Dotace</Headline>
      </HeadlineGroup>

      <Paragraph>
        Přehled projektů, které jsou nebo byly spolufinancovány z veřejných
        prostředků.
      </Paragraph>

      <ContentList>
        {grants.map((grant) => (
          <ContentListItem key={grant.slug}>
            <ContentLink
              to={href('/grants/:grantSlug', { grantSlug: grant.slug })}
            >
              <ContentLinkTitle>{grant.name}</ContentLinkTitle>
              <ContentLinkFooter>
                <span>{grant.year}</span>
                <span>{grant.sponsor}</span>
              </ContentLinkFooter>
            </ContentLink>
          </ContentListItem>
        ))}
      </ContentList>
    </Page>
  )
}
