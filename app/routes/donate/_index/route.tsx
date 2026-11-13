// noinspection JSUnusedGlobalSymbols

import NumberFlow from '@number-flow/react'
import {
  type ChangeEvent,
  type FocusEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import { href } from 'react-router'
import { CopyButton } from '~/components/copy-button'
import { Disclosure } from '~/components/disclosure'
import { DisclosureContent } from '~/components/disclosure-content'
import { DisclosureSummary } from '~/components/disclosure-summary'
import { LinkButton } from '~/components/link-button'
import { PageHero } from '~/components/page-hero'
import { PageHeroEyebrow } from '~/components/page-hero-eyebrow'
import { PageHeroHeadline } from '~/components/page-hero-headline'
import { PageHeroSubheadline } from '~/components/page-hero-subheadline'
import { RadioGroup } from '~/components/radio-group'
import { RadioTile } from '~/components/radio-tile'
import { RadioTileGroup } from '~/components/radio-tile-group'
import { TextField } from '~/components/text-field'
import { TextFieldControl } from '~/components/text-field-control'
import { TextFieldLabel } from '~/components/text-field-label'
import { VisuallyHidden } from '~/components/visually-hidden'
import { DONATION_PAYMENT } from '~/data/donation-payment'
import styles from './_styles.module.css'
import { DonationAbroadDescription } from './components/donation-abroad-description'
import { DonationCard } from './components/donation-card'
import { DonationConfirmation } from './components/donation-confirmation'
import { DonationConfirmationDescription } from './components/donation-confirmation-description'
import { DonationConfirmationHeading } from './components/donation-confirmation-heading'
import { DonationQr } from './components/donation-qr'
import { DonationQrAmount } from './components/donation-qr-amount'
import { DonationQrHint } from './components/donation-qr-hint'
import { DonationQrImage } from './components/donation-qr-image'
import { PaymentDetail } from './components/payment-detail'
import { PaymentDetailGroup } from './components/payment-detail-group'

export { meta } from './_meta'

const PRESET_AMOUNTS = [150, 300, 600, 1200] as const

// Shown in groups of four, as banks print it; copied without the spaces (wnyfw8po).
const IBAN_IN_GROUPS = DONATION_PAYMENT.iban.replace(/.{4}(?!$)/g, '$& ')

export default function RouteComponent() {
  const [amount, setAmount] = useState<number | ''>(PRESET_AMOUNTS[1])
  const [qrAmount, setQrAmount] = useState<number | ''>(PRESET_AMOUNTS[1])
  const debounceRef = useRef<number>(undefined)

  useEffect(() => () => window.clearTimeout(debounceRef.current), [])

  const handlePresetChange = (preset: number) => {
    window.clearTimeout(debounceRef.current)
    setAmount(preset)
    setQrAmount(preset)
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.valueAsNumber
    const next = Number.isNaN(value) ? '' : value
    setAmount(next)
    window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => setQrAmount(next), 600)
  }

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const value = event.target.valueAsNumber
    if (Number.isNaN(value) || value <= 0) {
      window.clearTimeout(debounceRef.current)
      setAmount('')
      setQrAmount('')
    }
  }

  const hasValidAmount = typeof amount === 'number' && amount > 0
  const isQrLoading = !hasValidAmount || amount !== qrAmount

  const paymentParams = new URLSearchParams({
    amount: String(amount),
  })

  return (
    <>
      <PageHero>
        <PageHeroEyebrow>Staňte se podporovatelem</PageHeroEyebrow>
        <PageHeroHeadline>Dobré nápady si zaslouží prostor</PageHeroHeadline>
        <PageHeroSubheadline>
          Díky darům můžeme vydávat Vedneměsíčník a provozovat web, a dávat tak
          studentům prostor psát, tvořit a být slyšet.
        </PageHeroSubheadline>
      </PageHero>

      <div className={styles.content}>
        <DonationCard>
          <div className={styles.choice}>
            <div className={styles.intro}>
              <h2 className={styles.cardTitle}>Vyberte výši daru</h2>
              <p className={styles.cardText}>
                Vyberte částku nebo zadejte vlastní. Dar pošlete bankovním
                převodem.
              </p>
            </div>

            <RadioGroup>
              <legend>
                <VisuallyHidden>Rychlá volba</VisuallyHidden>
              </legend>
              <RadioTileGroup>
                {PRESET_AMOUNTS.map((preset) => (
                  <RadioTile
                    checked={amount === preset}
                    key={preset}
                    name={'preset-amount'}
                    onChange={() => handlePresetChange(preset)}
                    value={preset}
                  >
                    {preset.toLocaleString('cs-CZ')} Kč
                  </RadioTile>
                ))}
              </RadioTileGroup>
            </RadioGroup>

            <TextField id={'donate-amount'}>
              <TextFieldLabel>Vlastní částka</TextFieldLabel>
              <div className={styles.amountRow}>
                <TextFieldControl
                  className={styles.amountInput}
                  inputMode={'numeric'}
                  min={1}
                  onBlur={handleBlur}
                  onChange={handleChange}
                  placeholder={'Zadejte částku'}
                  step={1}
                  type={'number'}
                  value={amount}
                />
                <span className={styles.currency}>Kč</span>
              </div>
            </TextField>

            <PaymentDetailGroup>
              <PaymentDetail label="Příjemce">
                {DONATION_PAYMENT.recipient}
              </PaymentDetail>
              <PaymentDetail label="Číslo účtu">
                <CopyButton value={DONATION_PAYMENT.accountNumber}>
                  {DONATION_PAYMENT.accountNumber}
                </CopyButton>
              </PaymentDetail>
              <PaymentDetail label="Variabilní symbol">
                <CopyButton value={DONATION_PAYMENT.variableSymbol}>
                  {DONATION_PAYMENT.variableSymbol}
                </CopyButton>
              </PaymentDetail>
              <PaymentDetail label="Zpráva pro příjemce">
                <CopyButton value={DONATION_PAYMENT.message}>
                  {DONATION_PAYMENT.message}
                </CopyButton>
              </PaymentDetail>
            </PaymentDetailGroup>

            {/* Closed for the donor paying from a Czech account (wnyfw8po);
                wording from copy thread ti38wq1x. */}
            <Disclosure>
              <DisclosureSummary>
                Posíláte dar ze zahraničního účtu?
              </DisclosureSummary>
              <DisclosureContent>
                <DonationAbroadDescription>
                  Pošlete dar v eurech na IBAN níže se zprávou pro příjemce
                  „Dar“, bez variabilního symbolu. Eura naše banka převede na
                  koruny. QR kód zahraniční aplikace obvykle nepřečtou.
                </DonationAbroadDescription>
                <PaymentDetailGroup>
                  <PaymentDetail label="IBAN">
                    <CopyButton value={DONATION_PAYMENT.iban}>
                      {IBAN_IN_GROUPS}
                    </CopyButton>
                  </PaymentDetail>
                  <PaymentDetail label="BIC (SWIFT)">
                    <CopyButton value={DONATION_PAYMENT.bic}>
                      {DONATION_PAYMENT.bic}
                    </CopyButton>
                  </PaymentDetail>
                </PaymentDetailGroup>
              </DisclosureContent>
            </Disclosure>
          </div>

          <DonationQr>
            <DonationQrImage
              isLoading={isQrLoading}
              src={`${href('/resources/donation-qr-code')}?amount=${qrAmount}`}
            />
            <DonationQrAmount>
              <NumberFlow locales="cs-CZ" suffix=" Kč" value={amount || 0} />
            </DonationQrAmount>
            <DonationQrHint>
              Naskenujte QR kód ve své bankovní aplikaci. Platební údaje se
              vyplní automaticky.
            </DonationQrHint>
            <LinkButton
              disabled={!hasValidAmount}
              reloadDocument
              size={'sm'}
              to={`${href('/resources/donation-qr-code-download')}?${paymentParams}`}
              variant={'outline'}
            >
              Stáhnout QR kód
            </LinkButton>
          </DonationQr>
        </DonationCard>

        <section className={styles.thanks}>
          <h2 className={styles.thanksHeading}>Děkujeme za podporu</h2>
          <p className={styles.thanksText}>
            Děkujeme všem, kteří přispívají na Vedneměsíčník.
          </p>
        </section>

        <DonationConfirmation>
          <DonationConfirmationHeading>
            Potřebujete potvrzení o daru?
          </DonationConfirmationHeading>
          <DonationConfirmationDescription>
            Vyplňte krátký formulář, podle kterého dohledáme vaše platby. Pak
            vystavíme potvrzení o přijatých darech za kalendářní rok, které
            můžete použít pro daňové účely.
          </DonationConfirmationDescription>
          <LinkButton
            to={href('/donate/request-confirmation')}
            variant={'outline'}
          >
            Požádat o potvrzení
          </LinkButton>
        </DonationConfirmation>
      </div>
    </>
  )
}
