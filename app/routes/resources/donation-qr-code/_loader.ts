import QRCode from 'qrcode'

import { getDonationShortPaymentDescriptor } from '~/utils/get-donation-short-payment-descriptor.server'

import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const shortPaymentDescriptor = getDonationShortPaymentDescriptor(request)

  const svg = await QRCode.toString(shortPaymentDescriptor, {
    errorCorrectionLevel: 'M',
    margin: 0,
    type: 'svg',
  })

  return new Response(svg, {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Type': 'image/svg+xml',
    },
  })
}
