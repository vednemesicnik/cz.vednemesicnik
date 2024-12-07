export const formConfig = {
  intent: {
    name: "intent",
    value: {
      delete: "delete",
      signOut: "sign-out",
      signInWithBiometric: "sign-in-with-biometric",
    },
  },
  authenticityToken: {
    name: "csrf",
  },
} as const
