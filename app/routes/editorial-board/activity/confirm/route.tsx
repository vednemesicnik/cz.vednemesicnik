// noinspection JSUnusedGlobalSymbols

import type { ReactNode } from 'react'
import { Form, useNavigation } from 'react-router'

import { Button } from '~/components/button'
import { Callout } from '~/components/callout'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { HoneypotInputs } from '~/components/honeypot-inputs'
import { HoneypotProvider } from '~/components/honeypot-provider'
import { MailHyperlink } from '~/components/mail-hyperlink'
import { Page } from '~/components/page'
import type { ActivityAction } from '~/config/editorial-board-activity-config'

import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { AnswerAddress } from './components/answer-address'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'
export { middleware } from './_middleware'

const EDITORIAL_OFFICE_ADDRESS = 'redakce@vednemesicnik.cz'
const PERSONAL_DATA_ADDRESS = 'udaje@vednemesicnik.cz'

const editorialOffice = (
  <MailHyperlink address={EDITORIAL_OFFICE_ADDRESS}>
    {EDITORIAL_OFFICE_ADDRESS}
  </MailHyperlink>
)

const CONFIRM = {
  button: 'Jsem pořád v redakci',
  headline: 'Jste pořád v redakci?',
  lead: 'Potvrďte prosím, že jste pořád v redakci Vedneměsíčníku.',
}

// Each choice before its button. Confirming from the question and from the removal
// notice read the same up to the button; the sentence under it differs (design 15j).
const CHOICES: Record<
  ActivityAction,
  { button: string; headline: string; lead: ReactNode; note: string }
> = {
  confirmActive: {
    ...CONFIRM,
    note: 'Pokud odcházíte nebo si dáváte pauzu, použijte v e-mailu tlačítko „Odcházím z redakce“.',
  },
  leave: {
    button: 'Odejít z redakce',
    headline: 'Potvrďte odchod',
    lead: (
      <>
        Odejít můžete i na čas. Na stránce Redakce pak nebudete. Změna se může
        projevit se zpožděním. Kontakty si ponecháme, abychom s vámi zůstali ve
        spojení. Pokud si přejete jejich smazání, napište nám na{' '}
        <MailHyperlink address={PERSONAL_DATA_ADDRESS}>
          {PERSONAL_DATA_ADDRESS}
        </MailHyperlink>
        .
      </>
    ),
    note: 'Pokud v redakci zůstáváte, použijte v e-mailu tlačítko „Jsem pořád v redakci“.',
  },
  reactivate: {
    ...CONFIRM,
    note: 'Pokud už v redakci nejste, můžete stránku zavřít.',
  },
}

// What an expired link says after its last day: the way on depends on the choice.
const EXPIRED_WAY_ON: Record<ActivityAction, string> = {
  confirmActive:
    'Pokud jste pořád v redakci a ještě jste neodpověděli, napište nám prosím na',
  leave: 'Pokud chcete oznámit odchod nebo pauzu, napište nám prosím na',
  reactivate: 'Pokud jste pořád v redakci, napište nám prosím na',
}

const Notice = ({
  children,
  headline,
}: {
  children: ReactNode
  headline: string
}) => (
  <Page>
    <HeadlineGroup className={styles.headlineGroup}>
      <Headline>{headline}</Headline>
    </HeadlineGroup>

    <div className={styles.content}>
      <p className={styles.lead}>{children}</p>
    </div>
  </Page>
)

/**
 * The link from the re-confirmation e-mails (design 15j). Opening it writes nothing, the
 * button does. A damaged link and the script's „no“ after the button look the same, and
 * neither shows the address, because a damaged link cannot be trusted.
 */
export default function RouteComponent({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const navigation = useNavigation()
  const isSubmitting = navigation.state !== 'idle'

  if (loaderData.status === 'invalid' || actionData?.result === 'unusable') {
    return (
      <Notice headline={'Tento odkaz nelze použít'}>
        Pokud jste už odpověď na stránce potvrdili, nemusíte nic dělat. Jinak
        nám prosím napište na {editorialOffice}.
      </Notice>
    )
  }

  if (loaderData.status === 'expired') {
    return (
      <Notice headline={'Odkaz už neplatí'}>
        Odkaz platil naposledy {loaderData.lastDay}.{' '}
        {EXPIRED_WAY_ON[loaderData.action]} {editorialOffice}.
      </Notice>
    )
  }

  const choice = CHOICES[loaderData.action]

  return (
    <HoneypotProvider {...loaderData.honeypotInputProps}>
      <Page>
        <HeadlineGroup className={styles.headlineGroup}>
          <Headline>{choice.headline}</Headline>
        </HeadlineGroup>

        <div className={styles.content}>
          {actionData?.result === 'failed' && (
            <Callout className={styles.callout} role={'alert'} tone={'error'}>
              Odpověď se teď nepodařilo odeslat. Zkuste to prosím znovu.
            </Callout>
          )}

          <p className={styles.lead}>{choice.lead}</p>

          <AnswerAddress>{loaderData.email}</AnswerAddress>

          <Form className={styles.form} method={'post'}>
            <HoneypotInputs />
            <input name={'token'} type={'hidden'} value={loaderData.token} />

            <Button
              className={styles.action}
              disabled={isSubmitting}
              type={'submit'}
            >
              {choice.button}
            </Button>
          </Form>

          <p className={styles.note}>{choice.note}</p>
        </div>
      </Page>
    </HoneypotProvider>
  )
}
