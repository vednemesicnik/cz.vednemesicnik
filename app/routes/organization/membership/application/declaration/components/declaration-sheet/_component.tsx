import { ORGANIZATION_REGISTRATION_NUMBER } from '~/config/site-config'
import { formatNumericDate } from '~/utils/format-numeric-date'
import type { MembershipDetails } from '~/utils/membership-application/membership-details-schema'

import sheetStyles from './_styles.css?raw'

type Props = {
  details: MembershipDetails
  /** Under 18 today: the guardian's block is on the sheet. */
  isMinor: boolean
}

/**
 * The filled declaration, one A4 page, as a whole document (design 15d). It has
 * its own tokens and takes nothing from the site. The viewport is as wide as the
 * sheet, so a phone shows the sheet across its screen and a pinch zooms it.
 */
export const DeclarationSheet = ({ details, isMinor }: Props) => (
  <html lang={'cs-CZ'}>
    <head>
      <meta charSet={'utf-8'} />
      <meta content={'width=794'} name={'viewport'} />
      <meta content={'light'} name={'color-scheme'} />
      <meta content={'noindex, nofollow'} name={'robots'} />
      <title>Přihláška do spolku</title>
      <style
        // Our own stylesheet; no applicant's value.
        // biome-ignore lint/security/noDangerouslySetInnerHtml: see above
        dangerouslySetInnerHTML={{ __html: sheetStyles }}
      />
    </head>
    <body>
      <main className={'sheet'}>
        <p className={'label'}>
          Vedneměsíčník, z.&nbsp;s. · IČO&nbsp;
          {ORGANIZATION_REGISTRATION_NUMBER}
        </p>
        <h1 className={'title'}>Přihláška do spolku</h1>

        <dl className={'fields'}>
          <dt className={'label'}>Jméno a příjmení</dt>
          <dd>
            {details.firstName} {details.lastName}
          </dd>
          <dt className={'label'}>Datum narození</dt>
          <dd>{formatNumericDate(new Date(details.dateOfBirth))}</dd>
          <dt className={'label'}>Trvalé bydliště</dt>
          <dd>{details.address}</dd>
          <dt className={'label'}>E-mail</dt>
          <dd>{details.email}</dd>
          {details.phone !== undefined && (
            <>
              <dt className={'label'}>Telefon</dt>
              <dd>{details.phone}</dd>
            </>
          )}
        </dl>

        <p className={'declaration'}>
          Žádám o členství ve spolku Vedneměsíčník, z.&nbsp;s. Ztotožňuji se
          s&nbsp;posláním spolku a mám zájem podílet se na jeho činnosti.
          Studuji nebo mám dokončené studium na jedné z&nbsp;českobudějovických
          středních škol. Znám stanovy spolku a souhlasím s&nbsp;nimi.
        </p>

        <div className={'signatures'}>
          <div className={'signature'}>
            <span className={'signature-line'}>Místo a datum</span>
            <span className={'signature-line'}>Podpis</span>
          </div>

          {isMinor && (
            <section className={'guardian'}>
              <h2 className={'section-title'}>Zákonný zástupce</h2>
              <div className={'signature'}>
                <span className={'signature-line'}>Jméno a příjmení</span>
                <span className={'signature-line'}>Podpis</span>
              </div>
            </section>
          )}
        </div>
      </main>
    </body>
  </html>
)
