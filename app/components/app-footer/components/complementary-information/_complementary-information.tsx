import styles from "./_complementary-information.module.css"
// import { SponsorLogo } from "./_sponsor-logo"

export const ComplementaryInformation = () => {
  return (
    <section className={styles.container}>
      <h2 className={"screen-reader-only"}>Doplňující informace</h2>
      {/*<section className={styles.sponsorSection}>*/}
      {/*  <h3 className={"screen-reader-only"}>Sponzor</h3>*/}
      {/*  <SponsorLogo className={styles.sponsorLogo} />*/}
      {/*  <p className={styles.descriptionText}>*/}
      {/*    Vedneměsíčník je spolufinancován Statutárním městem*/}
      {/*    České&nbsp;Budějovice*/}
      {/*  </p>*/}
      {/*</section>*/}
      <section className={styles.operatorSection}>
        <h3 className={"screen-reader-only"}>Provozovatel</h3>
        <p className={styles.descriptionText}>
          Webové stránky provozuje Vedneměsíčník,&nbsp;z.&nbsp;s.
          IČO:&nbsp;22851356
        </p>
      </section>
    </section>
  )
}

ComplementaryInformation.displayName = "ComplementaryInformation"
