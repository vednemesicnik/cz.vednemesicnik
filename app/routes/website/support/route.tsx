// noinspection JSUnusedGlobalSymbols

import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { MailHyperlink } from '~/components/mail-hyperlink'
import { Page } from '~/components/page'
import { Paragraph } from '~/components/paragraph'

const SUPPORT_EMAIL_ADDRESS = 'podpora@vednemesicnik.cz'

export { meta } from './_meta'

export default function RouteComponent() {
  return (
    <Page>
      <HeadlineGroup>
        <Headline>Jsme tu pro vás</Headline>
      </HeadlineGroup>
      <Paragraph>Našli jste chybu nebo máte nápad na vylepšení?</Paragraph>
      <Paragraph>
        Napište nám na{' '}
        <MailHyperlink address={SUPPORT_EMAIL_ADDRESS}>
          {SUPPORT_EMAIL_ADDRESS}
        </MailHyperlink>
        .
      </Paragraph>
    </Page>
  )
}
