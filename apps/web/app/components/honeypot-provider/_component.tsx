import { createContext, type ReactNode, useContext } from 'react'

type HoneypotContext = {
  nameFieldName: string
  validFromFieldName: string
  encryptedValidFrom: string
}

const Context = createContext<HoneypotContext | undefined>(undefined)

type Props = HoneypotContext & {
  children: ReactNode
}

export const HoneypotProvider = ({ children, ...value }: Props) => (
  <Context.Provider value={value}>{children}</Context.Provider>
)

export const useHoneypot = () => {
  const context = useContext(Context)

  if (context === undefined) {
    throw new Error('useHoneypot must be used within a HoneypotProvider')
  }

  return context
}
