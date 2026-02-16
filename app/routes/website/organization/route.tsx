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
        především podporou a sponzorováním studentského časopisu Vedneměsíčník,
        který vychází zpravidla čtyřikrát do roka. Časopis je šířen bezúplatně
        jako neziskový projekt pro širokou veřejnost. Každé vydané číslo je
        následně archivováno pro budoucí generace.
      </Paragraph>
      <Paragraph>
        Mezi doplňkové aktivity spolku patří organizování různých společenských
        a kulturních akcí pro středoškolské studenty (literárních večerů a
        autorských čtení).
      </Paragraph>
      <Paragraph>
        Za účelem podpory studentské tvorby spolek provozuje tyto webové stránky
        a digitální archiv. Obsah stránek (články, PDF soubory, grafika) je
        tvořen nezávislou studentskou redakcí bez redakčního vlivu či předběžné
        kontroly ze strany spolku. Spolek v této souvislosti vystupuje výhradně
        jako poskytovatel služby ukládání informací ve smyslu § 5 zákona č.
        480/2004 Sb.
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
