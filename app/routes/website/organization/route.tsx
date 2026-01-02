// noinspection JSUnusedGlobalSymbols

// import { BulletedList } from '~/components/bulleted-list'
// import { Divider } from '~/components/divider'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
// import { Hyperlink } from '~/components/hyperlink'
// import { ListItem } from '~/components/list-item'
import { Page } from '~/components/page'
import { Paragraph } from '~/components/paragraph'

export default function RouteComponent() {
  return (
    <Page>
      <HeadlineGroup>
        <Headline>Vedneměsíčník, z.&nbsp;s.</Headline>
      </HeadlineGroup>
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
      {/*<Divider variant={'primary'} />*/}
      {/*<Paragraph>Vedneměsíčník vychází za laskavé podpory:</Paragraph>*/}
      {/*<BulletedList>*/}
      {/*  <ListItem>Literární kavárna Měsíc ve dne</ListItem>*/}
      {/*  <ListItem>*/}
      {/*    <Hyperlink href="https://www.bigy-cb.cz/bigy/">*/}
      {/*      Biskupské gymnázium J. N. Neumanna v Č. Budějovicích*/}
      {/*    </Hyperlink>*/}
      {/*  </ListItem>*/}
      {/*  <ListItem>*/}
      {/*    <Hyperlink href="https://www.fokus-cb.cz/">*/}
      {/*      Fokus České Budějovice*/}
      {/*    </Hyperlink>*/}
      {/*  </ListItem>*/}
      {/*</BulletedList>*/}
    </Page>
  )
}

export { meta } from './_meta'
