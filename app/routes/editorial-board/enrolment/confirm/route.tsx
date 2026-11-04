// noinspection JSUnusedGlobalSymbols

import { Form, href, useNavigation } from 'react-router'

import { Button } from '~/components/button'
import { Callout } from '~/components/callout'
import { Headline } from '~/components/headline'
import { HeadlineGroup } from '~/components/headline-group'
import { HoneypotInputs } from '~/components/honeypot-inputs'
import { HoneypotProvider } from '~/components/honeypot-provider'
import { LinkButton } from '~/components/link-button'
import { Page } from '~/components/page'

import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { EnrolmentDetails } from './components/enrolment-details'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'
export { middleware } from './_middleware'

/**
 * The link from the e-mail (design 15e-confirm). Opening it writes nothing, the button
 * does. An unknown, expired and used link look the same, so the page says nothing about
 * which one it was.
 */
export default function RouteComponent({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const navigation = useNavigation()
  const isSubmitting = navigation.state !== 'idle'

  if (loaderData.status === 'invalid') {
    return (
      <Page>
        <HeadlineGroup className={styles.headlineGroup}>
          <Headline>Tento odkaz nelze použít</Headline>
        </HeadlineGroup>

        <div className={styles.content}>
          <p className={styles.lead}>
            Pokud jste přihlášku už potvrdili, nemusíte nic dělat. Pokud jste ji
            ještě nepotvrdili, vyplňte ji znovu.
          </p>

          <LinkButton
            className={styles.action}
            to={href('/editorial-board/enrolment')}
            variant={'outline'}
          >
            Vyplnit přihlášku
          </LinkButton>
        </div>
      </Page>
    )
  }

  return (
    <HoneypotProvider {...loaderData.honeypotInputProps}>
      <Page>
        <HeadlineGroup className={styles.headlineGroup}>
          <Headline>Potvrďte přihlášku</Headline>
        </HeadlineGroup>

        <div className={styles.content}>
          {actionData?.failed ? (
            <Callout className={styles.callout} role={'alert'} tone={'error'}>
              Přihlášku se teď nepodařilo potvrdit. Zkuste to prosím znovu.
            </Callout>
          ) : (
            <p className={styles.lead}>
              Potvrďte, že se chcete přidat k redakci Vedneměsíčníku s těmito
              údaji:
            </p>
          )}

          <EnrolmentDetails {...loaderData.details} />

          <Form className={styles.form} method={'post'}>
            <HoneypotInputs />
            <input name={'token'} type={'hidden'} value={loaderData.token} />

            <Button
              className={styles.action}
              disabled={isSubmitting}
              type={'submit'}
            >
              Potvrdit přihlášku
            </Button>
          </Form>

          <p className={styles.note}>
            Pokud jste přihlášku neposílali, stránku zavřete.
          </p>
        </div>
      </Page>
    </HoneypotProvider>
  )
}
