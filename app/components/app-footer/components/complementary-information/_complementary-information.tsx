import styles from "./_complementary-information.module.css"
import logoCB from "./assets/logo-cb.png"

export const ComplementaryInformation = () => {
  return (
    <section className={styles.container}>
      <h2 className={"screen-reader-only"}>Doplňující informace</h2>
      <section className={styles.sponsorSection}>
        <h3 className={"screen-reader-only"}>Sponzor</h3>
        <img className={styles.sponsorLogo} src={logoCB} alt={"Logo Českých Budějovic"} />
        <p className={styles.descriptionText}>Vedneměsíčník je spolufinancován Statutárním městem České Budějovice</p>
      </section>
      <section className={styles.operatorSection}>
        <h3 className={"screen-reader-only"}>Provozovatel</h3>
        <p className={styles.descriptionText}>Webové stránky provozuje Vedneměsíčník, z. s. IČO: 22851356</p>
      </section>
    </section>
  )
}

ComplementaryInformation.displayName = "ComplementaryInformation"
