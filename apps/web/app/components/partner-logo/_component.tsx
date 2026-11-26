import styles from './_styles.module.css'

type Props = {
  alt: string
  height: number
  src: string
  width: number
}

/**
 * A foreign subject's logo — a grant provider, a partner (design 15g, gm5nuxml).
 *
 * The logo keeps its original colours on a white plate in light and dark mode
 * alike, so switching schemes moves nothing. It is 64 px high at every width;
 * a logo wider than the plate is limited by the width and sits in the middle
 * of the 64 px, aligned to the start.
 *
 * @param alt - The subject's name
 * @param width - The file's intrinsic width, for its aspect ratio
 * @param height - The file's intrinsic height, for its aspect ratio
 * @returns The logo on its plate
 */
export const PartnerLogo = ({ alt, height, src, width }: Props) => {
  return (
    <span className={styles.plate}>
      <img
        alt={alt}
        className={styles.image}
        decoding={'async'}
        height={height}
        src={src}
        width={width}
      />
    </span>
  )
}
