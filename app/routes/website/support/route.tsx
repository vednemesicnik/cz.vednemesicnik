// noinspection JSUnusedGlobalSymbols

import { Headline } from '~/components/headline'
import { MailHyperlink } from '~/components/mail-hyperlink'
import { Page } from '~/components/page'
import { Paragraph } from '~/components/paragraph'

const SUPPORT_EMAIL_ADDRESS = 'podpora@vednemesicnik.cz'

export default function Route() {
  return (
    <Page>
      <Headline>Jsme tu pro vás</Headline>

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

export { meta } from './_meta'
