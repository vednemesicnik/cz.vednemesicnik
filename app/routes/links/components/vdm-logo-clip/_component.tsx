import styles from "./_styles.module.css"

export const VdmLogoClip = () => {
  const id = "vdm-logo-clip-path"
  const title = "Logo Vedneměsíčníku"

  return (
    <div className={styles.container} role="img" aria-label={title}>
      <svg
        width="0"
        height="0"
        viewBox="0 0 92 92"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.clip}
        aria-hidden="true"
      >
        <title>{title}</title>
        <desc>Definice ořezové cesty pro logo Vedneměsíčníku</desc>
        <defs>
          <clipPath id={id}>
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M92.0018 -3.05176e-05V92.0002H0.00195312V-3.05176e-05H92.0018ZM18.4016 76H73.6022C74.9276 76 76.0022 74.9256 76.0022 73.6003V18.3997C76.0022 17.0743 74.9276 16 73.6022 16H18.4016C17.0762 16 16.0022 17.0743 16.0022 18.3997V73.6003C16.0022 74.9256 17.0762 76 18.4016 76ZM71.2022 71.68H20.8022C20.675 71.68 20.5525 71.6294 20.4625 71.5394C20.3725 71.4494 20.3222 71.3273 20.3222 71.2V20.8C20.3222 20.6727 20.3725 20.5506 20.4625 20.4606C20.5525 20.3706 20.675 20.32 20.8022 20.32H71.2022C71.3294 20.32 71.4512 20.3706 71.5412 20.4606C71.6312 20.5506 71.6822 20.6727 71.6822 20.8V71.2C71.6822 71.3273 71.6312 71.4494 71.5412 71.5394C71.4512 71.6294 71.3294 71.68 71.2022 71.68ZM62.5621 25.12H52.4822V46.99L39.5222 25.12H28.0022L52.4822 66.88H62.5621V25.12Z"
            />
          </clipPath>
        </defs>
      </svg>

      <div
        className={styles.logo}
        style={{ clipPath: `url(#${id})` }}
        aria-hidden="true"
      />
    </div>
  )
}
