import QRCode from 'qrcode'

import { getDonationShortPaymentDescriptor } from '~/utils/get-donation-short-payment-descriptor.server'

import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const shortPaymentDescriptor = getDonationShortPaymentDescriptor(request)

  const pngBuffer = await QRCode.toBuffer(shortPaymentDescriptor, {
    errorCorrectionLevel: 'M',
    margin: 4,
    width: 600,
  })

  return new Response(new Uint8Array(pngBuffer), {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Disposition': 'attachment; filename="vdm-qr-platba.png"',
      'Content-Type': 'image/png',
    },
  })
}
