import { href } from 'react-router'
import { FEED_ITEM_LIMIT } from '~/config/feed-config'
import { SITE_NAME } from '~/config/site-config'
import { prisma } from '~/utils/db.server'
import type { Feed } from '~/utils/feeds/feed-types'
import { toAbsoluteUrl } from '~/utils/feeds/to-absolute-url.server'
import { issueTitleSelect } from '~/utils/issue/issue-title-select'
import { resolveIssueTitles } from '~/utils/issue/resolve-issue-titles.server'

/**
 * The archive feed: the printed issues most recently published on the web, each
 * linking straight to its PDF. An issue without a PDF has nowhere to lead and is
 * left out, as on `/archive`. A supplement names its main issue only once that
 * issue is published.
 *
 * @param feedPath - The feed's own path, `.xml` or `.json`.
 * @returns The channel (wording of the 17a card, copy uvjknd7d) and its items.
 */
export const loadArchiveFeed = async (feedPath: string): Promise<Feed> => {
  const issues = await prisma.issue.findMany({
    // When an issue went on the web, which is what a reader is told about.
    orderBy: { publishedAt: 'desc' },
    select: {
      ...issueTitleSelect,
      pdf: { select: { fileName: true } },
      publishedAt: true,
    },
    take: FEED_ITEM_LIMIT,
    where: { state: 'published' },
  })

  const titledIssues = await resolveIssueTitles(issues, { state: 'published' })

  return {
    channel: {
      description: 'Nová tištěná čísla časopisu.',
      feedUrl: toAbsoluteUrl(feedPath),
      link: toAbsoluteUrl(href('/archive')),
      title: `${SITE_NAME}: Archiv čísel`,
    },
    items: titledIssues.flatMap(({ pdf, publishedAt, title }) =>
      pdf?.fileName == null || publishedAt === null
        ? []
        : [
            {
              link: toAbsoluteUrl(
                href('/archive/:fileName', { fileName: pdf.fileName }),
              ),
              publishedAt,
              title,
            },
          ],
    ),
  }
}
