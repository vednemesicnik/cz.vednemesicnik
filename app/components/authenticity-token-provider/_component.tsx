import { createContext, type ReactNode, useContext } from 'react'

// Context

const Context = createContext<string | null>(null)

// Provider

type Props = {
  token: string
  children: ReactNode
}

export const AuthenticityTokenProvider = ({ token, children }: Props) => {
  return <Context.Provider value={token}>{children}</Context.Provider>
}

// Hook

export const useAuthenticityToken = () => {
  const context = useContext(Context)

  if (context === null) {
    throw new Error(
      'useAuthenticityToken must be used within a AuthenticityTokenProvider',
    )
  }

  return context
}
