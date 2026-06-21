type ShortPaymentDescriptorOptions = {
  iban: string
  bic: string
  currency: string
  name: string
  amount: number
  message: string
  variableSymbol: string
}

export function createShortPaymentDescriptor(
  options: ShortPaymentDescriptorOptions,
): string {
  const { iban, bic, currency, name, amount, message, variableSymbol } = options

  return [
    'SPD*1.0',
    `ACC:${iban}+${bic}`,
    `CC:${currency}`,
    `RN:${name}`,
    `AM:${amount.toFixed(2)}`,
    `MSG:${message}`,
    `X-VS:${variableSymbol}`,
  ].join('*')
}
