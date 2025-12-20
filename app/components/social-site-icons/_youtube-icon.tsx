type Props = {
  className?: string
}

export const YoutubeIcon = ({ className }: Props) => {
  return (
    <svg
      aria-label={'Ikona YouTube'}
      className={className}
      height={'100%'}
      role={'img'}
      style={{
        clipRule: 'evenodd',
        fill: '#ffffff',
        fillRule: 'evenodd',
        strokeLinejoin: 'round',
        strokeMiterlimit: 2,
      }}
      version={'1.1'}
      viewBox={'0 0 400 400'}
      width={'100%'}
      xmlns={'http://www.w3.org/2000/svg'}
      xmlSpace={'preserve'}
    >
      <path
        d={
          'M179.352,225.942l-0.009,-56.195l54.041,28.196l-54.032,27.999Zm118.651,-65.93c-0,0 -1.954,-13.782 -7.951,-19.851c-7.605,-7.966 -16.13,-8.005 -20.04,-8.471c-27.987,-2.024 -69.969,-2.024 -69.969,-2.024l-0.087,0c0,0 -41.981,0 -69.969,2.024c-3.909,0.466 -12.431,0.505 -20.039,8.471c-5.997,6.069 -7.948,19.851 -7.948,19.851c0,0 -2,16.185 -2,32.37l0,15.173c0,16.184 2,32.369 2,32.369c0,0 1.951,13.782 7.948,19.852c7.608,7.966 17.602,7.714 22.053,8.549c16,1.534 67.999,2.009 67.999,2.009c0,-0 42.025,-0.064 70.012,-2.087c3.91,-0.466 12.435,-0.505 20.04,-8.471c5.997,-6.07 7.951,-19.852 7.951,-19.852c-0,0 1.997,-16.185 1.997,-32.369l0,-15.173c0,-16.185 -1.997,-32.37 -1.997,-32.37Z'
        }
      />
    </svg>
  )
}

YoutubeIcon.displayName = 'YoutubeIcon'
