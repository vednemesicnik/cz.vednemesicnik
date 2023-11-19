// noinspection JSUnusedGlobalSymbols

import type { MetaFunction } from "@remix-run/node"
import { Page } from "~/components/page"

export default function Organization() {
  return (
    <Page>
      <h1>Vedneměsíčník, z. s.</h1>
      <p>
        Spolek Vedneměsíčník, který vznikl v říjnu roku 2010, své cíle realizuje především publikováním časopisu
        Vedneměsíčník, který vychází v množství nejvýše čtyř čísel za rok, každé v nákladu cca 500 výtisků. Tento
        časopis je distribuován zdarma zejména v Literární kavárně Měsíc ve dne, na českobudějovických středních
        školách, v klubech, čajovnách a v kině Kotva. Každé číslo je pak archivováno v Jihočeské vědecké knihovně v
        oddělení regionálního tisku. Mezi doplňkové aktivity spolku patří organizování různých společenských a
        kulturních akcí pro středoškolské studenty (literárních večerů a autorských čtení).
      </p>
      <p>Vedneměsíčník vychází za laskavé podpory:</p>
      <ul>
        <li>Literární kavárna Měsíc ve dne</li>
        <li>
          <a href="https://www.bigy-cb.cz/bigy/">Biskupské gymnázium J. N. Neumanna v Č. Budějovicích</a>
        </li>
        <li>
          <a href="https://www.fokus-cb.cz/">Fokus České Budějovice</a>
        </li>
      </ul>
    </Page>
  )
}

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník | Spolek" }]
}
