// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'
import { ContentLinkAuthor } from '~/components/content-link-author'
import { ContentLinkFooter } from '~/components/content-link-footer'
import { ContentLinkPublishDate } from '~/components/content-link-publish-date'
import { ContentLinkTitle } from '~/components/content-link-title'
import { ContentList } from '~/components/content-list'
import { ContentListItem } from '~/components/content-list-item'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { Page } from '~/components/page'
import { PostContentLink } from '~/components/post-content-link'
import { Subheadline } from '~/components/subheadline'
import { grants } from '~/data/grants'

export { meta } from './_meta'

export default function RouteComponent() {
  return (
    <Page>
      <HeadlineGroup>
        <Headline>Dotace</Headline>
        <Subheadline>
          Přehled projektů, které jsou nebo byly spolufinancovány z veřejných
          prostředků.
        </Subheadline>
      </HeadlineGroup>

      <ContentList>
        {grants.map((grant) => (
          <ContentListItem key={grant.slug}>
            <PostContentLink
              to={href('/grants/:grantSlug', { grantSlug: grant.slug })}
            >
              <ContentLinkTitle>{grant.name}</ContentLinkTitle>
              {/* The sponsor before the year, like an article's author before
                  its date (15g). */}
              <ContentLinkFooter>
                <ContentLinkAuthor>{grant.sponsor}</ContentLinkAuthor>
                <ContentLinkPublishDate
                  date={{
                    formatted: String(grant.year),
                    iso: String(grant.year),
                  }}
                />
              </ContentLinkFooter>
            </PostContentLink>
          </ContentListItem>
        ))}
      </ContentList>
    </Page>
  )
}
