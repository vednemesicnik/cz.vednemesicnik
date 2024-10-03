// noinspection JSUnusedGlobalSymbols

import { type MetaFunction } from "@remix-run/node"

import { Headline } from "app/components/headline"
import { Divider } from "~/components/divider"
import { List } from "~/components/list"
import { ListItem } from "~/components/list-item"
import { Page } from "~/components/page"
import { Paragraph } from "~/components/paragraph"

export const meta: MetaFunction = () => {
  return [
    { title: "Vedneměsíčník | Spolek" },
    { name: "description", content: "O spolku Vedneměsíčník, z. s." },
  ]
}

export default function Organization() {
  return (
    <Page>
      <Headline>Vedneměsíčník, z.&nbsp;s.</Headline>
      <Paragraph>
        Spolek Vedneměsíčník, který vznikl v říjnu roku 2010, své cíle realizuje
        především publikováním časopisu Vedneměsíčník, který vychází v množství
        nejvýše čtyř čísel za rok, každé v nákladu cca 500 výtisků.
      </Paragraph>
      <Paragraph>
        Tento časopis je distribuován zdarma zejména v Literární kavárně Měsíc
        ve dne, na českobudějovických středních školách, v klubech, čajovnách a
        v kině Kotva.
      </Paragraph>
      <Paragraph>
        Každé číslo je pak archivováno v Jihočeské vědecké knihovně v oddělení
        regionálního tisku.
      </Paragraph>
      <Paragraph>
        Mezi doplňkové aktivity spolku patří organizování různých společenských
        a kulturních akcí pro středoškolské studenty (literárních večerů a
        autorských čtení).
      </Paragraph>
      <Divider />
      <Paragraph>Vedneměsíčník vychází za laskavé podpory:</Paragraph>
      <List>
        <ListItem>Literární kavárna Měsíc ve dne</ListItem>
        <ListItem>
          <a href="https://www.bigy-cb.cz/bigy/">
            Biskupské gymnázium J. N. Neumanna v Č. Budějovicích
          </a>
        </ListItem>
        <ListItem>
          <a href="https://www.fokus-cb.cz/">Fokus České Budějovice</a>
        </ListItem>
      </List>
    </Page>
  )
}
