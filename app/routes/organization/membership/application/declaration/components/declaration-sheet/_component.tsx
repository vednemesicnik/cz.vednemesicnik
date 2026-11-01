import latinExtendedFontUrl from '@fontsource-variable/source-serif-4/files/source-serif-4-latin-ext-opsz-normal.woff2?url'
import latinFontUrl from '@fontsource-variable/source-serif-4/files/source-serif-4-latin-opsz-normal.woff2?url'

import { ORGANIZATION_REGISTRATION_NUMBER } from '~/config/site-config'
import { formatNumericDate } from '~/utils/format-numeric-date'
import type { MembershipDetails } from '~/utils/membership-application/membership-details-schema'

import sheetStyles from './_styles.css?raw'

const FONT_FACES = `
@font-face {
  font-family: 'Source Serif 4';
  font-style: normal;
  font-display: swap;
  font-weight: 200 900;
  src: url(${latinExtendedFontUrl}) format('woff2-variations');
  unicode-range: U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF;
}
@font-face {
  font-family: 'Source Serif 4';
  font-style: normal;
  font-display: swap;
  font-weight: 200 900;
  src: url(${latinFontUrl}) format('woff2-variations');
  unicode-range: U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;
}`

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
      <link href={'https://rsms.me/inter/inter.css'} rel={'stylesheet'} />
      <style
        // Our own stylesheet and the build's font addresses; no applicant's value.
        // biome-ignore lint/security/noDangerouslySetInnerHtml: see above
        dangerouslySetInnerHTML={{ __html: `${FONT_FACES}\n${sheetStyles}` }}
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
