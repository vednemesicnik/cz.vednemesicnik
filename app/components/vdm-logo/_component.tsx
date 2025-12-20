import { clsx } from 'clsx'

import styles from './_styles.module.css'

type Props = {
  children?: never
  className?: string
  variant?: 'default' | 'editMode' | 'admin'
}

export const VdmLogo = ({ className, variant = 'default' }: Props) => {
  return (
    <svg
      aria-label={'Logo VDM'}
      className={clsx(
        styles.svg,
        variant === 'default' && styles.default,
        variant === 'editMode' && styles.editMode,
        variant === 'admin' && styles.admin,
        className,
      )}
      height={'100%'}
      role={'img'}
      viewBox={'0 0 1000 1000'}
      width={'100%'}
      xmlns={'http://www.w3.org/2000/svg'}
    >
      <clipPath id={'_clip1'}>
        <rect height={'1000'} width={'1000'} x={'0'} y={'0'} />
      </clipPath>
      <g clipPath={'url(#_clip1)'}>
        <rect
          className={styles.gradientRect}
          height={'696'}
          width={'168'}
          x={'608'}
          y={'152'}
        />
        <path
          className={styles.mainPath}
          d={'M200,152L392,152L776,800L776,848L608,848L200,152Z'}
        />
        <path
          className={styles.mainPath}
          d={
            'M39.995,1000C17.906,1000 0,982.094 0,960.005L0,39.995C0,17.906 17.906,0 39.995,0L960.005,0C982.094,0 1000,17.906 1000,39.995C1000,200.795 1000,799.205 1000,960.005C1000,982.094 982.094,1000 960.005,1000C799.205,1000 200.795,1000 39.995,1000ZM920,928C922.122,928 924.157,927.157 925.657,925.657C927.157,924.157 928,922.122 928,920L928,80C928,77.878 927.157,75.843 925.657,74.343C924.157,72.843 922.122,72 920,72L80,72C77.878,72 75.843,72.843 74.343,74.343C72.843,75.843 72,77.878 72,80L72,920C72,922.122 72.843,924.157 74.343,925.657C75.843,927.157 77.878,928 80,928L920,928Z'
          }
        />
      </g>
      <defs>
        <linearGradient
          gradientTransform={'matrix(576,-696,696,576,200,848)'}
          gradientUnits={'userSpaceOnUse'}
          id={'logo_linear_gradient'}
          x1={'0'}
          x2={'1'}
          y1={'0'}
          y2={'0'}
        >
          <stop className={styles.gradientStopStart} offset={'0'} />
          <stop className={styles.gradientStopMid} offset={'0.52'} />
          <stop className={styles.gradientStopEnd} offset={'1'} />
        </linearGradient>
      </defs>
    </svg>
  )
}
