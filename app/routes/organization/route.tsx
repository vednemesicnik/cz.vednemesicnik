// noinspection JSUnusedGlobalSymbols

import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { Page } from '~/components/page'
import { Paragraph } from '~/components/paragraph'
import styles from './_styles.module.css'

export default function RouteComponent() {
  return (
    <Page>
      <HeadlineGroup>
        <Headline>Vedneměsíčník, z.&nbsp;s.</Headline>
      </HeadlineGroup>
      <div className={styles.content}>
        <Paragraph>
          Spolek Vedneměsíčník vydává stejnojmenný studentský kulturní časopis,
          který je v Českých Budějovicích zdarma dostupný studentům i široké
          veřejnosti. Spolek vznikl v říjnu roku 2010 a podporuje mladé autory a
          jejich tvorbu.
        </Paragraph>
        <Paragraph>
          Časopis dává prostor autorským textům studentů středních škol a
          gymnázií. Přináší jejich pohled na kulturu, veřejný prostor a
          společenské dění, od místních témat po širší otázky současného světa.
          Práce na časopisu umožňuje mladým lidem rozvíjet vlastní psaní,
          získávat redakční zkušenosti a podílet se na společném výsledku.
        </Paragraph>
        <Paragraph>
          Tištěný časopis doplňují webové stránky, které nabízejí další prostor
          pro publikování studentských textů a zpřístupňují je širšímu okruhu
          čtenářů. Vedle vydávání časopisu spolek pořádá také kulturní a
          společenské akce pro studenty.
        </Paragraph>
      </div>
    </Page>
  )
}

export { meta } from './_meta'
