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
        Spolek Vedneměsíčník, který vznikl v říjnu roku 2010, podporuje
        studentskou tvorbu a zajišťuje organizační a technické zázemí pro
        vydávání studentského časopisu Vedneměsíčník. Časopis vychází zpravidla
        čtyřikrát ročně a je šířen bezúplatně jako neziskový projekt pro širokou
        veřejnost.
      </Paragraph>
      <Paragraph>
        Spolek dále pořádá společenské a kulturní akce pro středoškolské
        studenty, zejména literární večery a autorská čtení.
      </Paragraph>
      <Paragraph>
        Součástí podpory studentské tvorby je také provoz webových stránek a
        digitálního archivu vydaných čísel časopisu.
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
