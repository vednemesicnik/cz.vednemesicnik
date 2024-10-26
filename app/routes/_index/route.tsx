import { Link, useLoaderData } from "@remix-run/react"

import { Headline } from "~/components/headline"
import { Hyperlink } from "~/components/hyperlink"
import { Page } from "~/components/page"
import { Paragraph } from "~/components/paragraph"
import { Tile } from "~/components/tile"
import { sizeConfig } from "~/config/size-config"
import { type loader } from "~/routes/_index/_loader"
import { getArchivedIssueCoverSrc } from "~/utils/get-archived-issue-cover-src"
import { getArchivedIssuePdfSrc } from "~/utils/get-archived-issue-pdf-src"

export default function Route() {
  const loaderData = useLoaderData<typeof loader>()

  return (
    <Page>
      <Headline>Vítejte na stránkách Vedneměsíčníku!</Headline>
      <Paragraph>
        Hledáte naše články? Klikněte{" "}
        <Hyperlink to={"https://medium.com/vednemesicnik"}>sem</Hyperlink>.
      </Paragraph>
      <Paragraph>
        Všechny naše výtisky najdete <a href="/archive">zde</a>.
      </Paragraph>
      <Paragraph>
        Máme také podcastové epizody. Klikněte <a href="/podcasts">sem</a>.
      </Paragraph>
      <Paragraph>
        Chcete nám něco napsat? Klikněte{" "}
        <a href="/editorial-board/route">sem</a>.
      </Paragraph>

      <Headline>Poslední výtisk</Headline>
      {loaderData.latestArchivedIssues.map((issue) => {
        const coverAlt = issue.cover?.altText ?? ""
        const coverSrc = getArchivedIssueCoverSrc(issue.cover?.id ?? "")
        const pdfSrc = getArchivedIssuePdfSrc(issue.pdf?.fileName ?? "")

        return (
          <Link to={pdfSrc} key={issue.id} title={issue.label} reloadDocument>
            <Tile
              label={issue.label}
              src={coverSrc}
              alt={coverAlt}
              width={sizeConfig.archivedIssueCover.width}
              height={sizeConfig.archivedIssueCover.height}
            />
          </Link>
        )
      })}
    </Page>
  )
}

export { loader } from "./_loader"
export { meta } from "./_meta"
