type Props = {
  children?: never
  width?: string | number
  height?: string | number
}

export const VdmLogo = ({ width = "100%", height = "100%" }: Props) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 1000 1000"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      xmlSpace="preserve"
      style={{ fillRule: "evenodd", clipRule: "evenodd", strokeLinejoin: "round", strokeMiterlimit: 2 }}
    >
      <clipPath id="_clip1">
        <rect x="0" y="0" width="1000" height="1000" />
      </clipPath>
      <g clipPath="url(#_clip1)">
        <rect x="608" y="152" width="168" height="696" style={{ fill: "url(#logo_linear_gradient)" }} />
        <path d="M200,152L392,152L776,800L776,848L608,848L200,152Z" style={{ fill: "#5CFFA3" }} />
        <path
          d="M39.995,1000C17.906,1000 0,982.094 0,960.005L0,39.995C0,17.906 17.906,0 39.995,0L960.005,0C982.094,0 1000,17.906 1000,39.995C1000,200.795 1000,799.205 1000,960.005C1000,982.094 982.094,1000 960.005,1000C799.205,1000 200.795,1000 39.995,1000ZM920,928C922.122,928 924.157,927.157 925.657,925.657C927.157,924.157 928,922.122 928,920L928,80C928,77.878 927.157,75.843 925.657,74.343C924.157,72.843 922.122,72 920,72L80,72C77.878,72 75.843,72.843 74.343,74.343C72.843,75.843 72,77.878 72,80L72,920C72,922.122 72.843,924.157 74.343,925.657C75.843,927.157 77.878,928 80,928L920,928Z"
          style={{ fill: "#5CFFA3" }}
        />
      </g>
      <defs>
        <linearGradient
          id="logo_linear_gradient"
          x1="0"
          y1="0"
          x2="1"
          y2="0"
          gradientUnits="userSpaceOnUse"
          gradientTransform="matrix(576,-696,696,576,200,848)"
        >
          <stop offset="0" style={{ stopColor: "#0068b8", stopOpacity: 1 }} />
          <stop offset="0.52" style={{ stopColor: "#43d6a9", stopOpacity: 1 }} />
          <stop offset="1" style={{ stopColor: "#5CFFA3", stopOpacity: 1 }} />
        </linearGradient>
      </defs>
    </svg>
  )
}
