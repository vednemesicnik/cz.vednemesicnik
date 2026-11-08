// noinspection JSUnusedGlobalSymbols

import { Heading } from '~/components/heading'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { NumberedList } from '~/components/numbered-list'
import { Page } from '~/components/page'
import { Paragraph } from '~/components/paragraph'
import { Subheadline } from '~/components/subheadline'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { FeedCard } from './components/feed-card'
import { FeedCardAddress } from './components/feed-card-address'
import { FeedCardText } from './components/feed-card-text'
import { FeedCardTitle } from './components/feed-card-title'

export { loader } from './_loader'
export { meta } from './_meta'

// What comes, then how, then what to choose from (17a, copy uvjknd7d, drf8a7ql,
// r4teulu8).
export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { archiveAddress, articlesAddress, podcastFeeds } = loaderData

  return (
    <Page>
      <HeadlineGroup>
        <Headline>Nemusíte nás pořád vyhlížet</Headline>
        <Subheadline>
          Nové články, tištěná čísla i epizody můžete sledovat ve čtečce
          novinek.
        </Subheadline>
      </HeadlineGroup>

      <section className={styles.section}>
        <Heading className={styles.heading} level={2}>
          Jak na to
        </Heading>
        <NumberedList className={styles.steps}>
          <li>
            Otevřete čtečku novinek, která sleduje novinky z webů. Pokud žádnou
            nemáte, vyhledejte na webu „RSS čtečka“.
          </li>
          <li>
            Použijte tlačítko s adresou toho, co chcete odebírat. Tím ji
            zkopírujete.
          </li>
          <li>Ve čtečce zvolte přidání odběru a vložte zkopírovanou adresu.</li>
        </NumberedList>
        <Paragraph className={styles.note}>
          Adresy jsou ve formátu RSS. U nás k odběru nepotřebujete e-mail ani
          účet. Odběr zrušíte ve čtečce.
        </Paragraph>
      </section>

      <section className={styles.section}>
        <Heading className={styles.heading} level={2}>
          Co můžete odebírat
        </Heading>
        <div className={styles.cards}>
          <FeedCard>
            <FeedCardTitle>Články</FeedCardTitle>
            <FeedCardText>Nové články z našeho webu.</FeedCardText>
            <FeedCardAddress>{articlesAddress}</FeedCardAddress>
          </FeedCard>
          <FeedCard>
            <FeedCardTitle>Archiv čísel</FeedCardTitle>
            <FeedCardText>
              Nová tištěná čísla časopisu. Odkaz ve čtečce otevře přímo PDF.
            </FeedCardText>
            <FeedCardAddress>{archiveAddress}</FeedCardAddress>
          </FeedCard>
          {podcastFeeds.map(({ address, anchor, id, title }) => (
            <FeedCard id={anchor} key={id}>
              <FeedCardTitle>Podcast {title}</FeedCardTitle>
              <FeedCardText>
                Nové epizody ve čtečce novinek. Ze stránky epizody přejdete k
                poslechu. Tato adresa není pro podcastové aplikace.
              </FeedCardText>
              <FeedCardAddress>{address}</FeedCardAddress>
            </FeedCard>
          ))}
        </div>
      </section>
    </Page>
  )
}
